/**
 * Uji kebijakan keamanan database (RLS) tanpa perlu proyek Supabase.
 *
 * Memakai PGlite (PostgreSQL asli yang berjalan di WebAssembly). Skema `auth`
 * Supabase ditiru secukupnya: tabel auth.users, auth.uid(), auth.jwt(), dan peran
 * anon/authenticated. Migrasi yang diuji adalah file yang sama dengan yang
 * ditempel ke Supabase.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newExamId, toSaveArgs, type SaveExaminationArgs } from "@/lib/exam/payload";
import { answerChoice, evaluate, startSession, treeV1 } from "@/lib/screening";

// Semua migrasi, urut nama berkas: sama dengan urutan menempelkannya di Supabase.
const migrationsDir = fileURLToPath(new URL("../migrations/", import.meta.url));
const migrations = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(migrationsDir + f, "utf8"));

const ids = {
  elderA: "00000000-0000-0000-0000-0000000000a1",
  elderB: "00000000-0000-0000-0000-0000000000b1",
  careX: "00000000-0000-0000-0000-0000000000c1",
  careY: "00000000-0000-0000-0000-0000000000c2",
};

let db: PGlite;

/** Bertindak sebagai pengguna login (atau anon bila uid null). */
async function as(uid: string | null, opts: { anonymous?: boolean } = {}) {
  await db.exec("reset role");
  const claims = uid ? JSON.stringify({ sub: uid, is_anonymous: !!opts.anonymous }) : "";
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [uid ?? ""]);
  await db.query("select set_config('request.jwt.claims', $1, false)", [claims]);
  await db.exec(uid ? "set role authenticated" : "set role anon");
}

async function rows(sql: string, params: unknown[] = []) {
  return (await db.query(sql, params)).rows as Record<string, unknown>[];
}

async function fails(sql: string, params: unknown[] = [], reason?: RegExp) {
  await expect(db.query(sql, params)).rejects.toThrow(reason);
}

/** Ditolak oleh kebijakan RLS (bukan oleh validasi payload), supaya tes akses tidak lolos karena alasan lain. */
const RLS = /row-level security/;

/** Satu jawaban sah untuk save_examination; sumber harus sesuai mode (migrasi 0003). */
const oneAnswer = (source: "lansia" | "caregiver") =>
  JSON.stringify([
    { position: 0, question_id: "cough_today", value: "tidak", label: "Tidak", source,
      is_unknown: false, answered_at: "2026-10-14T00:00:00Z" },
  ]);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as
      $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on all functions in schema auth to anon, authenticated;
  `);
  for (const id of Object.values(ids)) {
    await db.query("insert into auth.users (id) values ($1)", [id]);
  }
  for (const sql of migrations) await db.exec(sql);

  await as(ids.careX);
  await db.query("insert into public.caregivers (id, display_name) values ($1, 'Sinta')", [ids.careX]);
  await as(ids.careY);
  await db.query("insert into public.caregivers (id, display_name) values ($1, 'Budi')", [ids.careY]);
  await as(ids.elderA, { anonymous: true });
  await db.query("select public.create_elder_profile('Ibu Ani', '60-65')");
  await as(ids.elderB, { anonymous: true });
  await db.query("select public.create_elder_profile('Pak Bono', '55-59')");
});

afterAll(async () => {
  await db.close();
});

async function elderIdOf(uid: string) {
  await db.exec("reset role");
  return (await rows("select id from public.elders where device_user_id = $1", [uid]))[0].id as string;
}

/** Menghubungkan caregiver ke lansia lewat alur lengkap QR. */
async function pair(elderUid: string, careUid: string, approve = true, share = false) {
  await as(elderUid, { anonymous: true });
  const token = (await rows("select public.create_pairing_token() t"))[0].t as string;
  await as(careUid);
  const linkId = (await rows("select public.request_pairing($1) id", [token]))[0].id as string;
  await as(elderUid, { anonymous: true });
  await db.query("select public.decide_link($1, $2, $3)", [linkId, approve, share]);
  return { token, linkId };
}

describe("akses tanpa login", () => {
  it("peran anon tidak bisa membaca tabel apa pun", async () => {
    await as(null);
    for (const t of [
      "caregivers", "elders", "care_links", "pairing_tokens",
      "examinations", "exam_answers", "reminder_schedules", "help_requests",
    ]) {
      await fails(`select * from public.${t}`);
    }
  });

  it("peran anon tidak bisa memanggil fungsi RPC", async () => {
    await as(null);
    await fails("select public.create_pairing_token()");
    await fails("select public.preview_pairing('x')");
    await fails("select public.create_elder_profile('x')");
  });
});

describe("profil", () => {
  it("lansia hanya melihat profilnya sendiri", async () => {
    await as(ids.elderA, { anonymous: true });
    const r = await rows("select display_name from public.elders");
    expect(r).toEqual([{ display_name: "Ibu Ani" }]);
  });

  it("create_elder_profile idempoten", async () => {
    await as(ids.elderA, { anonymous: true });
    const a = (await rows("select public.create_elder_profile('Nama lain') id"))[0].id;
    const b = (await rows("select public.create_elder_profile('Nama lain') id"))[0].id;
    expect(a).toBe(b);
    expect((await rows("select count(*)::int c from public.elders"))[0].c).toBe(1);
  });

  it("tidak bisa membuat profil lansia lewat INSERT langsung", async () => {
    await as(ids.careX);
    await fails("insert into public.elders (device_user_id, display_name) values ($1, 'x')", [ids.careX]);
  });

  it("caregiver tidak bisa membuat profil lansia", async () => {
    await as(ids.careX);
    await fails("select public.create_elder_profile('x')");
  });

  it("sesi anonim tidak bisa mendaftar sebagai caregiver", async () => {
    await as(ids.elderB, { anonymous: true });
    await fails("insert into public.caregivers (id, display_name) values ($1, 'x')", [ids.elderB]);
  });

  it("lansia tidak melihat caregiver yang tidak terhubung", async () => {
    await as(ids.elderA, { anonymous: true });
    expect(await rows("select * from public.caregivers")).toEqual([]);
  });
});

describe("pairing QR", () => {
  it("token disimpan sebagai hash, bukan teks asli", async () => {
    await as(ids.elderA, { anonymous: true });
    const token = (await rows("select public.create_pairing_token() t"))[0].t as string;
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    await db.exec("reset role");
    const stored = await rows("select token_hash from public.pairing_tokens");
    expect(stored.map((s) => s.token_hash)).not.toContain(token);
    await db.exec("delete from public.pairing_tokens");
  });

  it("token tidak bisa dibaca langsung oleh siapa pun", async () => {
    await as(ids.elderA, { anonymous: true });
    await db.query("select public.create_pairing_token()");
    await fails("select * from public.pairing_tokens");
    await as(ids.careX);
    await fails("select * from public.pairing_tokens");
    await db.exec("reset role");
    await db.exec("delete from public.pairing_tokens");
  });

  it("hanya sekali pakai", async () => {
    await as(ids.elderA, { anonymous: true });
    const token = (await rows("select public.create_pairing_token() t"))[0].t as string;
    await as(ids.careX);
    await db.query("select public.request_pairing($1)", [token]);
    await as(ids.careY);
    await fails("select public.request_pairing($1)", [token]);
    await db.exec("reset role");
    await db.exec("delete from public.care_links; delete from public.pairing_tokens");
  });

  it("kedaluwarsa setelah 10 menit", async () => {
    await as(ids.elderA, { anonymous: true });
    const token = (await rows("select public.create_pairing_token() t"))[0].t as string;
    await db.exec("reset role");
    await db.exec("update public.pairing_tokens set expires_at = now() - interval '1 second'");
    await as(ids.careX);
    await fails("select public.preview_pairing($1)", [token]);
    await fails("select public.request_pairing($1)", [token]);
    await db.exec("reset role");
    await db.exec("delete from public.pairing_tokens");
  });

  it("token acak ditolak", async () => {
    await as(ids.careX);
    await fails("select public.request_pairing('tebakan')");
  });

  it("lansia tidak bisa memakai token (hanya caregiver)", async () => {
    await as(ids.elderA, { anonymous: true });
    const token = (await rows("select public.create_pairing_token() t"))[0].t as string;
    await fails("select public.request_pairing($1)", [token]);
    await db.exec("reset role");
    await db.exec("delete from public.pairing_tokens");
  });

  it("jumlah token aktif dibatasi", async () => {
    await as(ids.elderA, { anonymous: true });
    for (let i = 0; i < 3; i++) await db.query("select public.create_pairing_token()");
    await fails("select public.create_pairing_token()");
    await db.exec("reset role");
    await db.exec("delete from public.pairing_tokens");
  });

  it("preview menampilkan nama lansia tanpa memakai token", async () => {
    await as(ids.elderA, { anonymous: true });
    const token = (await rows("select public.create_pairing_token() t"))[0].t as string;
    await as(ids.careX);
    expect((await rows("select public.preview_pairing($1) n", [token]))[0].n).toBe("Ibu Ani");
    expect((await rows("select public.preview_pairing($1) n", [token]))[0].n).toBe("Ibu Ani");
    await db.exec("reset role");
    await db.exec("delete from public.pairing_tokens");
  });
});

describe("persetujuan hubungan", () => {
  it("caregiver belum bisa melihat apa pun sebelum lansia menyetujui", async () => {
    await as(ids.elderA, { anonymous: true });
    const token = (await rows("select public.create_pairing_token() t"))[0].t as string;
    await as(ids.careX);
    await db.query("select public.request_pairing($1)", [token]);
    expect(await rows("select * from public.elders")).toEqual([]);
    const links = await rows("select status from public.care_links");
    expect(links).toEqual([{ status: "pending" }]);
  });

  it("lansia melihat nama caregiver yang menunggu persetujuan (untuk layar persetujuan)", async () => {
    // Sama dengan embed listElderLinks: care_links -> caregivers(display_name).
    await as(ids.elderA, { anonymous: true });
    const r = await rows(
      `select l.status, c.display_name from public.care_links l
         left join public.caregivers c on c.id = l.caregiver_id`,
    );
    expect(r).toEqual([{ status: "pending", display_name: "Sinta" }]);
  });

  it("caregiver tidak bisa menyetujui dirinya sendiri", async () => {
    await as(ids.careX);
    const id = (await rows("select id from public.care_links"))[0].id;
    await fails("select public.decide_link($1, true, true)", [id]);
    await fails("update public.care_links set status = 'active', share_results = true");
  });

  it("lansia lain tidak bisa memutuskan hubungan orang lain", async () => {
    await as(ids.elderB, { anonymous: true });
    const id = await (async () => {
      await db.exec("reset role");
      return (await rows("select id from public.care_links"))[0].id;
    })();
    await as(ids.elderB, { anonymous: true });
    await fails("select public.decide_link($1, true, true)", [id]);
  });

  it("setelah disetujui tanpa berbagi hasil: caregiver melihat nama, bukan hasil", async () => {
    await as(ids.elderA, { anonymous: true });
    await db.exec("reset role");
    const id = (await rows("select id from public.care_links"))[0].id;
    await as(ids.elderA, { anonymous: true });
    await db.query("select public.decide_link($1, true, false)", [id]);
    const elder = await elderIdOf(ids.elderA);
    await as(ids.elderA, { anonymous: true });
    await db.query("select public.save_examination($1,$2,'mandiri','gejala-dasar','1.0.0-demo',now(),now(),'selesai','green','[]','[]',false,true,$3::jsonb)",
      ["11111111-1111-1111-1111-111111111111", elder, oneAnswer("lansia")]);
    await as(ids.careX);
    expect(await rows("select display_name from public.elders")).toEqual([{ display_name: "Ibu Ani" }]);
    expect(await rows("select * from public.examinations")).toEqual([]);
  });

  it("lansia bisa mengaktifkan berbagi hasil, lalu caregiver melihat hasilnya", async () => {
    await db.exec("reset role");
    const id = (await rows("select id from public.care_links"))[0].id;
    await as(ids.elderA, { anonymous: true });
    await db.query("select public.set_share_results($1, true)", [id]);
    await as(ids.careX);
    const r = await rows("select result_status from public.examinations");
    expect(r).toEqual([{ result_status: "green" }]);
  });

  it("caregiver lain yang tidak terhubung tetap tidak melihat apa pun", async () => {
    await as(ids.careY);
    expect(await rows("select * from public.elders")).toEqual([]);
    expect(await rows("select * from public.examinations")).toEqual([]);
    expect(await rows("select * from public.exam_answers")).toEqual([]);
  });

  it("lansia B tidak melihat data lansia A", async () => {
    await as(ids.elderB, { anonymous: true });
    expect(await rows("select display_name from public.elders")).toEqual([{ display_name: "Pak Bono" }]);
    expect(await rows("select * from public.examinations")).toEqual([]);
  });

  it("mencabut berbagi hasil langsung menutup akses hasil", async () => {
    await db.exec("reset role");
    const id = (await rows("select id from public.care_links"))[0].id;
    await as(ids.elderA, { anonymous: true });
    await db.query("select public.set_share_results($1, false)", [id]);
    await as(ids.careX);
    expect(await rows("select * from public.examinations")).toEqual([]);
  });

  it("memutus hubungan menutup seluruh akses caregiver", async () => {
    await db.exec("reset role");
    const id = (await rows("select id from public.care_links"))[0].id;
    await as(ids.elderA, { anonymous: true });
    await db.query("select public.set_share_results($1, true)", [id]);
    await db.query("select public.revoke_link($1)", [id]);
    await as(ids.careX);
    expect(await rows("select * from public.elders")).toEqual([]);
    expect(await rows("select * from public.examinations")).toEqual([]);
    const link = await rows("select status, share_results from public.care_links");
    expect(link).toEqual([{ status: "revoked", share_results: false }]);
  });

  it("hubungan yang ditolak tidak memberi akses", async () => {
    await db.exec("reset role");
    await db.exec("delete from public.care_links");
    await pair(ids.elderB, ids.careY, false);
    await as(ids.careY);
    expect(await rows("select * from public.elders")).toEqual([]);
  });
});

describe("pemeriksaan", () => {
  const exam = "22222222-2222-2222-2222-222222222222";
  const answers = JSON.stringify([
    { position: 0, question_id: "cough_today", value: "c_yes", label: "Ya", source: "lansia",
      is_unknown: false, answered_at: "2026-10-14T00:00:00Z" },
    { position: 1, question_id: "med_taken", value: "belum_diketahui", label: "Belum diketahui",
      source: "lansia", is_unknown: true, answered_at: "2026-10-14T00:01:00Z" },
  ]);

  it("lansia menyimpan pemeriksaan dan jawabannya; kirim ulang tidak menggandakan", async () => {
    await db.exec("reset role");
    await db.exec("delete from public.care_links; delete from public.examinations");
    const elder = await elderIdOf(ids.elderA);
    await as(ids.elderA, { anonymous: true });
    for (let i = 0; i < 2; i++) {
      await db.query(
        "select public.save_examination($1,$2,'mandiri','gejala-dasar','1.0.0-demo',now(),now(),'selesai','insufficient','[]','[]',false,true,$3::jsonb)",
        [exam, elder, answers],
      );
    }
    expect((await rows("select count(*)::int c from public.examinations"))[0].c).toBe(1);
    expect((await rows("select count(*)::int c from public.exam_answers"))[0].c).toBe(2);
  });

  it("lansia tidak bisa menyimpan pemeriksaan atas nama lansia lain", async () => {
    const other = await elderIdOf(ids.elderB);
    await as(ids.elderA, { anonymous: true });
    await fails(
      "select public.save_examination($1,$2,'mandiri','gejala-dasar','1.2.0-demo',now(),now(),'selesai','green','[]','[]',false,true,$3::jsonb)",
      ["33333333-3333-3333-3333-333333333333", other, oneAnswer("lansia")],
      RLS,
    );
  });

  it("tidak ada yang bisa mengubah atau menghapus pemeriksaan yang tersimpan", async () => {
    await as(ids.elderA, { anonymous: true });
    await fails("update public.examinations set result_status = 'green'");
    await fails("delete from public.examinations");
    await fails("update public.exam_answers set value = 'x'");
  });

  it("caregiver tanpa hubungan aktif tidak bisa menyimpan pemeriksaan", async () => {
    const elder = await elderIdOf(ids.elderA);
    await as(ids.careX);
    await fails(
      "select public.save_examination($1,$2,'caregiver','gejala-dasar','1.2.0-demo',now(),now(),'selesai','green','[]','[]',false,true,$3::jsonb)",
      ["44444444-4444-4444-4444-444444444444", elder, oneAnswer("caregiver")],
      RLS,
    );
  });

  it("caregiver terhubung dapat mencatat pemeriksaan mode caregiver dan tetap bisa membacanya", async () => {
    await pair(ids.elderA, ids.careX, true, false);
    const elder = await elderIdOf(ids.elderA);
    await as(ids.careX);
    await db.query(
      "select public.save_examination($1,$2,'caregiver','gejala-dasar','1.2.0-demo',now(),now(),'selesai','green','[]','[]',false,true,$3::jsonb)",
      ["55555555-5555-5555-5555-555555555555", elder, oneAnswer("caregiver")],
    );
    const r = await rows("select mode, caregiver_id from public.examinations");
    expect(r).toEqual([{ mode: "caregiver", caregiver_id: ids.careX }]);
  });

  it("caregiver tidak bisa menyamar sebagai mandiri", async () => {
    const elder = await elderIdOf(ids.elderA);
    await as(ids.careX);
    await fails(
      "select public.save_examination($1,$2,'mandiri','gejala-dasar','1.2.0-demo',now(),now(),'selesai','green','[]','[]',false,true,$3::jsonb)",
      ["66666666-6666-6666-6666-666666666666", elder, oneAnswer("lansia")],
      RLS,
    );
  });

  it("menghapus profil lansia ikut menghapus semua datanya", async () => {
    await as(ids.elderA, { anonymous: true });
    await db.query("delete from public.elders");
    await db.exec("reset role");
    for (const t of ["examinations", "exam_answers", "care_links"]) {
      expect((await rows(`select count(*)::int c from public.${t}`))[0].c).toBe(0);
    }
  });
});

describe("permintaan bantuan", () => {
  it("hanya caregiver terhubung yang bisa melihat dan menanggapi", async () => {
    await db.exec("reset role");
    await db.exec("delete from public.care_links");
    await as(ids.elderB, { anonymous: true });
    await db.exec("select public.create_elder_profile('Pak Bono')");
    const elder = await elderIdOf(ids.elderB);
    await as(ids.elderB, { anonymous: true });
    await db.query("insert into public.help_requests (elder_id) values ($1)", [elder]);

    await as(ids.careY);
    expect(await rows("select * from public.help_requests")).toEqual([]);

    await pair(ids.elderB, ids.careY, true, false);
    await as(ids.careY);
    const open = await rows("select id, status from public.help_requests");
    expect(open).toHaveLength(1);
    await db.query("update public.help_requests set status = 'taken', taken_by = $1", [ids.careY]);
    expect((await rows("select status from public.help_requests"))[0].status).toBe("taken");

    await as(ids.careX);
    expect(await rows("select * from public.help_requests")).toEqual([]);
  });

  it("caregiver tidak bisa membuat permintaan bantuan atas nama lansia", async () => {
    const elder = await elderIdOf(ids.elderB);
    await as(ids.careY);
    await fails("insert into public.help_requests (elder_id) values ($1)", [elder]);
  });
});

describe("payload penyimpanan dari klien", () => {
  // Memanggil RPC dengan argumen bernama, sama seperti PostgREST (supabase.rpc), memakai
  // payload yang dibuat toSaveArgs dari sesi mesin pohon keputusan yang sungguhan.
  const JSONB = new Set(["p_reasons", "p_actions", "p_answers"]);
  async function callSave(args: SaveExaminationArgs) {
    const keys = Object.keys(args) as (keyof SaveExaminationArgs)[];
    const sql = `select public.save_examination(${keys
      .map((k, i) => `${k} => $${i + 1}${JSONB.has(k) ? "::jsonb" : ""}`)
      .join(", ")}) id`;
    const params = keys.map((k) => (JSONB.has(k) ? JSON.stringify(args[k]) : args[k]));
    return (await rows(sql, params))[0].id as string;
  }

  function finished(steps: string[], mode: "mandiri" | "caregiver") {
    const source = mode === "caregiver" ? "caregiver" : "lansia";
    let s = startSession(treeV1, { mode });
    for (const step of steps) s = answerChoice(treeV1, s, step, source);
    return { session: s, result: evaluate(treeV1, s) };
  }

  it("pemeriksaan mandiri bertanda bahaya tersimpan lengkap dengan alasan yang bisa ditelusuri", async () => {
    const elder = await elderIdOf(ids.elderB);
    const { session, result } = finished(["ya", "d_lt3", "f_rare", "ya"], "mandiri");
    expect(result.status).toBe("red");
    const id = newExamId();
    await as(ids.elderB, { anonymous: true });
    expect(await callSave(toSaveArgs(id, elder, session, result))).toBe(id);
    // Kirim ulang dari antrean: tidak membuat data ganda.
    await callSave(toSaveArgs(id, elder, session, result));

    const [x] = await rows(
      "select status, result_status, interrupted, is_simulated, reasons from public.examinations where id = $1",
      [id],
    );
    expect(x).toMatchObject({ status: "terhenti", result_status: "red", interrupted: true, is_simulated: false });
    expect(x.reasons).toEqual(JSON.parse(JSON.stringify(result.reasons)));
    const answers = await rows(
      "select position, question_id, source from public.exam_answers where examination_id = $1 order by position",
      [id],
    );
    expect(answers.map((a) => a.question_id)).toEqual(session.answers.map((a) => a.nodeId));
    expect(new Set(answers.map((a) => a.source))).toEqual(new Set(["lansia"]));
  });

  it("pemeriksaan mode caregiver tersimpan atas nama caregiver yang terhubung", async () => {
    const elder = await elderIdOf(ids.elderB); // terhubung aktif dengan careY (tes sebelumnya)
    const { session, result } = finished(["tidak", "c_no", "m_none"], "caregiver");
    const id = newExamId();
    await as(ids.careY);
    await callSave(toSaveArgs(id, elder, session, result));
    const [x] = await rows("select mode, caregiver_id, status, result_status from public.examinations where id = $1", [id]);
    expect(x).toEqual({ mode: "caregiver", caregiver_id: ids.careY, status: "selesai", result_status: "green" });
  });
});

describe("riwayat yang dibaca caregiver (dashboard)", () => {
  // Melanjutkan keadaan tes sebelumnya: elderB terhubung aktif dengan careY tanpa izin
  // berbagi hasil; elderB punya pemeriksaan mandiri, careY mencatat satu mode caregiver.
  it("tanpa izin berbagi: hanya pemeriksaan yang ia catat sendiri, tanpa Cek Mandiri lansia", async () => {
    await as(ids.careY);
    const exams = await rows("select mode from public.examinations order by mode");
    expect(exams).toEqual([{ mode: "caregiver" }]);
    // Jawaban dari catatannya sendiri terlihat; jawaban Cek Mandiri lansia tidak.
    const answerSources = await rows("select distinct source from public.exam_answers");
    expect(answerSources).toEqual([{ source: "caregiver" }]);
  });

  it("setelah lansia mengizinkan: Cek Mandiri beserta jawabannya ikut terlihat", async () => {
    await db.exec("reset role");
    const elder = await elderIdOf(ids.elderB);
    const [link] = await rows("select id from public.care_links where elder_id = $1 and caregiver_id = $2", [
      elder,
      ids.careY,
    ]);
    await as(ids.elderB, { anonymous: true });
    await db.query("select public.set_share_results($1, true)", [link.id]);
    await as(ids.careY);
    const modes = await rows("select mode from public.examinations order by mode");
    expect(modes).toEqual([{ mode: "caregiver" }, { mode: "mandiri" }]);
    const n = (await rows("select count(*)::int c from public.exam_answers where source = 'lansia'"))[0].c;
    expect(n).toBeGreaterThan(0);
  });
});

describe("alur permintaan bantuan (sesuai src/lib/help.ts)", () => {
  // elderB terhubung aktif dengan careY (tes sebelumnya). careX dihubungkan juga di sini
  // untuk mensimulasikan dua caregiver yang menerima permintaan yang sama.
  let req: string;
  // Update bersyarat yang sama dengan takeHelpRequest.
  const take = (uid: string) =>
    rows(
      "update public.help_requests set status = 'taken', taken_by = $2, handled_at = now() where id = $1 and status = 'open' returning id",
      [req, uid],
    );

  it("lansia membuat permintaan baru", async () => {
    await pair(ids.elderB, ids.careX, true, false);
    const elder = await elderIdOf(ids.elderB);
    await as(ids.elderB, { anonymous: true });
    req = (await rows("insert into public.help_requests (elder_id) values ($1) returning id", [elder]))[0].id as string;
    expect(req).toBeTruthy();
  });

  it("lansia tidak bisa menandai permintaannya sendiri sebagai ditanggapi atau selesai", async () => {
    await as(ids.elderB, { anonymous: true });
    await fails("update public.help_requests set status = 'taken' where id = $1", [req]);
    await fails("update public.help_requests set status = 'done' where id = $1", [req]);
  });

  it("caregiver tidak bisa membatalkan atau menanggapi atas nama caregiver lain", async () => {
    await as(ids.careY);
    await fails("update public.help_requests set status = 'cancelled' where id = $1", [req]);
    await fails("update public.help_requests set status = 'taken', taken_by = $2 where id = $1", [req, ids.careX]);
  });

  it("dua caregiver menanggapi bersamaan: hanya yang pertama berhasil", async () => {
    await as(ids.careY);
    expect(await take(ids.careY)).toHaveLength(1);
    await as(ids.careX);
    expect(await take(ids.careX)).toHaveLength(0);
    await db.exec("reset role");
    const [r] = await rows("select status, taken_by from public.help_requests where id = $1", [req]);
    expect(r).toEqual({ status: "taken", taken_by: ids.careY });
  });

  it("lansia melihat siapa yang menanggapi, lalu bisa membatalkan", async () => {
    await as(ids.elderB, { anonymous: true });
    const [r] = await rows(
      `select h.status, c.display_name from public.help_requests h
         left join public.caregivers c on c.id = h.taken_by where h.id = $1`,
      [req],
    );
    expect(r).toEqual({ status: "taken", display_name: "Budi" });
    const done = await rows(
      "update public.help_requests set status = 'cancelled', handled_at = now() where id = $1 and status in ('open','taken') returning id",
      [req],
    );
    expect(done).toHaveLength(1);
  });
});

describe("transisi status permintaan bantuan (migrasi 0002)", () => {
  // Tanpa trigger 0002, semua perintah di bawah lolos RLS karena RLS hanya memeriksa nilai baru.
  let req: string;

  async function newRequest() {
    const elder = await elderIdOf(ids.elderB);
    await as(ids.elderB, { anonymous: true });
    return (await rows("insert into public.help_requests (elder_id) values ($1) returning id", [elder]))[0].id as string;
  }

  it("caregiver lain tidak bisa mengambil alih permintaan yang sudah ditanggapi", async () => {
    req = await newRequest();
    await as(ids.careY);
    await db.query("update public.help_requests set status = 'taken', taken_by = $2 where id = $1", [req, ids.careY]);
    await as(ids.careX);
    await fails("update public.help_requests set status = 'taken', taken_by = $2 where id = $1", [req, ids.careX]);
    await fails("update public.help_requests set status = 'done', taken_by = $2 where id = $1", [req, ids.careX]);
  });

  it("hanya caregiver yang menanggapi yang bisa menandai selesai", async () => {
    await as(ids.careY);
    await db.query("update public.help_requests set status = 'done', handled_at = now() where id = $1", [req]);
    await db.exec("reset role");
    expect((await rows("select status from public.help_requests where id = $1", [req]))[0].status).toBe("done");
  });

  it("permintaan yang selesai tidak bisa dibuka lagi oleh lansia maupun caregiver", async () => {
    await as(ids.elderB, { anonymous: true });
    await fails("update public.help_requests set status = 'open' where id = $1", [req]);
    await fails("update public.help_requests set status = 'cancelled' where id = $1", [req]);
    await as(ids.careY);
    await fails("update public.help_requests set status = 'taken', taken_by = $2 where id = $1", [req, ids.careY]);
  });

  it("permintaan yang dibatalkan tidak bisa dihidupkan lagi oleh caregiver", async () => {
    req = await newRequest();
    await db.query("update public.help_requests set status = 'cancelled' where id = $1", [req]);
    await as(ids.careY);
    await fails("update public.help_requests set status = 'taken', taken_by = $2 where id = $1", [req, ids.careY]);
  });

  it("tidak bisa melompat dari open langsung ke done, atau memindahkan ke lansia lain", async () => {
    req = await newRequest();
    await as(ids.careY);
    await fails("update public.help_requests set status = 'done', taken_by = $2 where id = $1", [req, ids.careY]);
    await as(ids.elderB, { anonymous: true });
    await fails("update public.help_requests set elder_id = gen_random_uuid() where id = $1", [req]);
  });

  it("fungsi trigger tidak bisa dipanggil langsung", async () => {
    await as(ids.careY);
    await fails("select public.check_help_request_transition()");
  });
});

describe("jadwal pengingat", () => {
  // elderB terhubung aktif dengan careX dan careY (tes sebelumnya).
  it("lansia membuat, mengubah lewat upsert per label, dan menghapus jadwalnya", async () => {
    const elder = await elderIdOf(ids.elderB);
    await as(ids.elderB, { anonymous: true });
    await db.query(
      "insert into public.reminder_schedules (elder_id, label, time_of_day) values ($1,'Pagi','07:00'),($1,'Malam','19:00')",
      [elder],
    );
    // Sama dengan saveReminders: upsert on conflict (elder_id, label).
    await db.query(
      `insert into public.reminder_schedules (elder_id, label, time_of_day, enabled) values ($1,'Pagi','06:30',false)
       on conflict (elder_id, label) do update set time_of_day = excluded.time_of_day, enabled = excluded.enabled`,
      [elder],
    );
    await db.query("delete from public.reminder_schedules where label = 'Malam'");
    const r = await rows("select label, time_of_day::text t, enabled from public.reminder_schedules order by label");
    expect(r).toEqual([{ label: "Pagi", t: "06:30:00", enabled: false }]);
  });

  it("nama jadwal tidak boleh kosong atau lebih dari 30 karakter", async () => {
    const elder = await elderIdOf(ids.elderB);
    await as(ids.elderB, { anonymous: true });
    await fails("insert into public.reminder_schedules (elder_id, label, time_of_day) values ($1,'','08:00')", [elder]);
    await fails("insert into public.reminder_schedules (elder_id, label, time_of_day) values ($1,$2,'08:00')", [
      elder,
      "x".repeat(31),
    ]);
  });

  it("caregiver terhubung hanya bisa membaca, tidak bisa mengubah", async () => {
    const elder = await elderIdOf(ids.elderB);
    await as(ids.careY);
    expect(await rows("select label from public.reminder_schedules")).toEqual([{ label: "Pagi" }]);
    await fails("insert into public.reminder_schedules (elder_id, label, time_of_day) values ($1,'Siang','12:00')", [elder]);
    // Update dan delete oleh caregiver: RLS menyaring baris, jadi tidak ada yang berubah.
    expect(await rows("update public.reminder_schedules set enabled = true returning id")).toEqual([]);
    expect(await rows("delete from public.reminder_schedules returning id")).toEqual([]);
    await db.exec("reset role");
    expect((await rows("select enabled from public.reminder_schedules"))[0].enabled).toBe(false);
  });

  it("lansia lain tidak melihat jadwal lansia ini", async () => {
    await as(ids.elderA, { anonymous: true }); // profil elderA sudah dihapus: sesi tanpa profil
    expect(await rows("select * from public.reminder_schedules")).toEqual([]);
  });
});

describe("pengaturan profil dan keluar dari profil lansia", () => {
  it("lansia mengubah nama dan usianya; caregiver tidak bisa mengubah profil lansia", async () => {
    const elder = await elderIdOf(ids.elderB);
    await as(ids.elderB, { anonymous: true });
    await db.query("update public.elders set display_name = 'Pak Bono S.', age_range = '60-65' where id = $1", [elder]);
    await as(ids.careY); // terhubung aktif, tetap tidak boleh mengubah
    expect(await rows("update public.elders set display_name = 'diubah' returning id")).toEqual([]);
    await db.exec("reset role");
    expect((await rows("select display_name, age_range from public.elders where id = $1", [elder]))[0]).toEqual({
      display_name: "Pak Bono S.",
      age_range: "60-65",
    });
  });

  it("lansia tidak bisa memindahkan profilnya ke sesi lain", async () => {
    await as(ids.elderB, { anonymous: true });
    await fails("update public.elders set device_user_id = $1", [ids.careX]);
  });

  it("caregiver hanya bisa mengubah namanya sendiri", async () => {
    await as(ids.careY);
    expect(await rows("update public.caregivers set display_name = 'Budi S.' returning id")).toEqual([{ id: ids.careY }]);
    expect(await rows("update public.caregivers set display_name = 'x' where id = $1 returning id", [ids.careX])).toEqual([]);
  });

  it("keluar dari profil menghapus seluruh data lansia, termasuk bantuan, jadwal, dan token", async () => {
    const elder = await elderIdOf(ids.elderB);
    await as(ids.elderB, { anonymous: true });
    await db.query("select public.create_pairing_token()");
    await db.query("delete from public.elders where id = $1", [elder]);
    await db.exec("reset role");
    for (const t of ["examinations", "care_links", "help_requests", "reminder_schedules", "pairing_tokens"]) {
      const n = (await rows(`select count(*)::int c from public.${t} where elder_id = $1`, [elder]))[0].c;
      expect(n, t).toBe(0);
    }
    // Akun caregiver tidak ikut terhapus.
    expect((await rows("select count(*)::int c from public.caregivers where id = $1", [ids.careY]))[0].c).toBe(1);
  });
});

describe("migrasi aman dijalankan ulang (Supabase Preview)", () => {
  it("0002 bisa dijalankan dua kali, dan trigger transisi tetap berlaku", async () => {
    await db.exec("reset role");
    const sql = readFileSync(migrationsDir + "0002_help_request_transitions.sql", "utf8");
    await db.exec(sql); // jalankan ulang: tidak boleh gagal
    const triggers = await rows(
      "select tgname from pg_trigger where tgrelid = 'public.help_requests'::regclass and not tgisinternal",
    );
    expect(triggers).toEqual([{ tgname: "help_requests_transition" }]); // tidak ganda
    // Aturan tetap berlaku setelah dijalankan ulang (trigger juga berlaku untuk superuser).
    const uid = "00000000-0000-0000-0000-0000000000d1";
    await db.query("insert into auth.users (id) values ($1)", [uid]);
    const elder = (
      await rows("insert into public.elders (device_user_id, display_name) values ($1, 'Uji') returning id", [uid])
    )[0].id;
    const req = (await rows("insert into public.help_requests (elder_id) values ($1) returning id", [elder]))[0].id;
    await fails("update public.help_requests set status = 'done' where id = $1", [req]);
    await db.query("update public.help_requests set status = 'cancelled' where id = $1", [req]); // transisi sah
  });
});

describe("uji keamanan dan validasi (kriteria penerimaan demo)", () => {
  // Data uji sendiri, terpisah dari blok lain: lansia Bu Cici, caregiver Citra (akan
  // dihubungkan), Dodi (orang asing, tidak pernah dihubungkan), dan dua akun kosong untuk
  // menguji input tidak sah.
  const U = {
    elder: "00000000-0000-0000-0000-0000000000e3",
    care: "00000000-0000-0000-0000-0000000000c3",
    stranger: "00000000-0000-0000-0000-0000000000c4",
    freshElder: "00000000-0000-0000-0000-0000000000e4",
    freshCare: "00000000-0000-0000-0000-0000000000c5",
  };
  let elder: string;
  let link: string;
  const ans = (qs: { q: string; source?: string }[]) =>
    JSON.stringify(
      qs.map((x, i) => ({
        position: i,
        question_id: x.q,
        value: "ya",
        label: "Ya",
        source: x.source ?? "lansia",
        is_unknown: false,
        answered_at: "2026-10-16T00:00:00Z",
      })),
    );
  const save = (id: string, mode: string, status: string, result: string, answers = "[]") =>
    db.query(
      `select public.save_examination($1, $2, $3, 'gejala-dasar', '1.2.0-demo', now(), now(), $4, $5,
         '[]', '[]', false, false, $6::jsonb)`,
      [id, elder, mode, status, result, answers],
    );

  it("persiapan data uji", async () => {
    await db.exec("reset role");
    for (const id of Object.values(U)) await db.query("insert into auth.users (id) values ($1)", [id]);
    await as(U.care);
    await db.query("insert into public.caregivers (id, display_name) values ($1, 'Citra')", [U.care]);
    await as(U.stranger);
    await db.query("insert into public.caregivers (id, display_name) values ($1, 'Dodi')", [U.stranger]);
    await as(U.elder, { anonymous: true });
    elder = (await rows("select public.create_elder_profile('Bu Cici', '60-65') id"))[0].id as string;
    expect(elder).toBeTruthy();
  });

  // ---------- Input tidak sah ----------

  it("profil dengan nama kosong, nama terlalu panjang, atau usia tidak sah ditolak", async () => {
    await as(U.freshElder, { anonymous: true });
    await fails("select public.create_elder_profile('', null)");
    await fails("select public.create_elder_profile($1, null)", ["x".repeat(61)]);
    await fails("select public.create_elder_profile('Pak Uji', '30-40')");
    await db.exec("reset role");
    expect((await rows("select count(*)::int c from public.elders where device_user_id = $1", [U.freshElder]))[0].c).toBe(0);
  });

  it("nama caregiver kosong ditolak", async () => {
    await as(U.freshCare);
    await fails("insert into public.caregivers (id, display_name) values ($1, '')", [U.freshCare]);
  });

  it("pemeriksaan dengan status, hasil, mode, atau sumber jawaban tidak sah ditolak", async () => {
    await as(U.elder, { anonymous: true });
    // "completed"/"interrupted" adalah nilai yang dulu dikirim persistence.ts lama.
    await expect(save("aaaaaaaa-0000-0000-0000-000000000001", "mandiri", "completed", "green")).rejects.toThrow();
    await expect(save("aaaaaaaa-0000-0000-0000-000000000002", "mandiri", "interrupted", "red")).rejects.toThrow();
    await expect(save("aaaaaaaa-0000-0000-0000-000000000003", "mandiri", "selesai", "blue")).rejects.toThrow();
    await expect(save("aaaaaaaa-0000-0000-0000-000000000004", "darurat", "selesai", "green")).rejects.toThrow();
    await expect(
      save("aaaaaaaa-0000-0000-0000-000000000005", "mandiri", "selesai", "green", ans([{ q: "cough_today", source: "robot" }])),
    ).rejects.toThrow();
  });

  it("jawaban ganda dalam satu pemeriksaan membatalkan seluruh penyimpanan (satu transaksi)", async () => {
    await as(U.elder, { anonymous: true });
    const id = "aaaaaaaa-0000-0000-0000-000000000006";
    await expect(
      save(id, "mandiri", "selesai", "green", ans([{ q: "cough_today" }, { q: "cough_today" }])),
    ).rejects.toThrow();
    await db.exec("reset role");
    expect(await rows("select id from public.examinations where id = $1", [id])).toEqual([]);
  });

  // ---------- Pengiriman ganda ----------

  it("kirim ulang dengan id sama tidak menggandakan dan tidak bisa menimpa isi yang tersimpan", async () => {
    await as(U.elder, { anonymous: true });
    const id = "aaaaaaaa-0000-0000-0000-000000000007";
    await save(id, "mandiri", "selesai", "green", ans([{ q: "cough_today" }]));
    // Percobaan "menimpa" lewat pengiriman ulang: hasil merah dengan dua jawaban.
    await save(id, "mandiri", "selesai", "insufficient", ans([{ q: "cough_today" }, { q: "cough_blood" }]));
    await db.exec("reset role");
    expect(await rows("select status, result_status from public.examinations where id = $1", [id])).toEqual([
      { status: "selesai", result_status: "green" },
    ]);
    expect((await rows("select count(*)::int c from public.exam_answers where examination_id = $1", [id]))[0].c).toBe(1);
  });

  // ---------- Akses tidak sah ----------

  it("orang asing tidak bisa memutuskan, mengubah izin, atau memutus hubungan orang lain", async () => {
    await as(U.elder, { anonymous: true });
    const token = (await rows("select public.create_pairing_token() t"))[0].t as string;
    await as(U.care);
    link = (await rows("select public.request_pairing($1) id", [token]))[0].id as string;
    await as(U.stranger);
    await fails("select public.decide_link($1, true, true)", [link]);
    await fails("select public.set_share_results($1, true)", [link]);
    await fails("select public.revoke_link($1)", [link]);
    expect(await rows("select * from public.care_links")).toEqual([]); // tidak melihat hubungan orang lain
  });

  it("caregiver tidak bisa memberi dirinya sendiri izin berbagi hasil", async () => {
    await as(U.elder, { anonymous: true });
    await db.query("select public.decide_link($1, true, false)", [link]);
    await as(U.care);
    await fails("select public.set_share_results($1, true)", [link]);
    await fails("update public.care_links set share_results = true where id = $1", [link]);
    await db.exec("reset role");
    expect((await rows("select share_results from public.care_links where id = $1", [link]))[0].share_results).toBe(false);
  });

  // ---------- Izin berbagi: sebelum dan sesudah perubahan ----------

  it("izin berbagi: mati -> tidak terlihat, hidup -> terlihat, mati lagi -> tertutup lagi", async () => {
    const visible = async () => {
      await as(U.care);
      return (await rows("select count(*)::int c from public.examinations where elder_id = $1 and mode = 'mandiri'", [elder]))[0].c;
    };
    expect(await visible()).toBe(0); // terhubung aktif, izin mati
    await as(U.elder, { anonymous: true });
    await db.query("select public.set_share_results($1, true)", [link]);
    expect(await visible()).toBe(1); // satu Cek Mandiri yang tersimpan di atas
    await as(U.elder, { anonymous: true });
    await db.query("select public.set_share_results($1, false)", [link]);
    expect(await visible()).toBe(0);
    await as(U.elder, { anonymous: true });
    await db.query("select public.set_share_results($1, true)", [link]);
    expect(await visible()).toBe(1);
  });

  // ---------- Putus hubungan ----------

  it("caregiver memutus hubungan: semua akses tertutup, termasuk simpan, jadwal, dan bantuan", async () => {
    await as(U.elder, { anonymous: true });
    await db.query("insert into public.reminder_schedules (elder_id, label, time_of_day) values ($1, 'Pagi', '07:00')", [elder]);
    await db.query("insert into public.help_requests (elder_id) values ($1)", [elder]);
    await as(U.care);
    expect((await rows("select count(*)::int c from public.reminder_schedules"))[0].c).toBe(1); // sebelum putus
    await db.query("select public.revoke_link($1)", [link]);
    expect(await rows("select * from public.elders")).toEqual([]);
    expect(await rows("select * from public.examinations where mode = 'mandiri'")).toEqual([]);
    expect(await rows("select * from public.reminder_schedules")).toEqual([]);
    expect(await rows("select * from public.help_requests")).toEqual([]);
    await expect(
      db.query(
        `select public.save_examination('aaaaaaaa-0000-0000-0000-000000000008', $1, 'caregiver', 'gejala-dasar',
           '1.2.0-demo', now(), now(), 'selesai', 'green', '[]', '[]', false, false, $2::jsonb)`,
        [elder, oneAnswer("caregiver")],
      ),
    ).rejects.toThrow(RLS);
  });

  it("token lama tidak bisa dipakai lagi; sambung ulang mulai dari pending tanpa izin berbagi lama", async () => {
    await as(U.elder, { anonymous: true });
    const token = (await rows("select public.create_pairing_token() t"))[0].t as string;
    await as(U.care);
    const again = (await rows("select public.request_pairing($1) id", [token]))[0].id as string;
    await fails("select public.request_pairing($1)", [token]); // sekali pakai
    await db.exec("reset role");
    expect((await rows("select status, share_results from public.care_links where id = $1", [again]))[0]).toEqual({
      status: "pending",
      share_results: false, // izin lama (true) tidak ikut kembali
    });
    // Penjamin utamanya ada di database, bukan di satu fungsi: izin berbagi hanya boleh menyala
    // bila hubungan aktif (CHECK di care_links), dan revoke_link mematikannya saat memutus.
    await fails("update public.care_links set share_results = true where id = $1", [again]);
    await as(U.care);
    expect(await rows("select * from public.examinations where mode = 'mandiri'")).toEqual([]);
  });
});

describe("pengetatan keamanan (migrasi 0003)", () => {
  const U = {
    elder: "00000000-0000-0000-0000-0000000000f1",
    care: "00000000-0000-0000-0000-0000000000f2",
  };
  let elder: string;
  let link: string;
  const exam = "bbbbbbbb-0000-0000-0000-000000000001";
  const examShared = "bbbbbbbb-0000-0000-0000-000000000002";

  const answer = (q: string, source = "lansia", extra: Record<string, unknown> = {}) => ({
    position: 0, question_id: q, value: "ya", label: "Ya", source, is_unknown: false,
    answered_at: "2026-10-16T00:00:00Z", ...extra,
  });
  const redReason = {
    ruleId: "R-COUGH-BLOOD", level: "red", nodeId: "cough_blood",
    question: "Apakah batuk Anda mengeluarkan darah?", answerLabel: "Ya", text: "Batuk disertai darah.",
  };

  /** Payload sah (Cek Mandiri, selesai, hijau) yang bisa diubah satu per satu. */
  const base = (over: Record<string, unknown> = {}) => ({
    p_id: "bbbbbbbb-0000-0000-0000-0000000000ff",
    p_mode: "mandiri",
    p_tree_id: "gejala-dasar",
    p_tree_version: "1.2.0-demo",
    p_started_at: "2026-10-16T00:00:00Z",
    p_finished_at: "2026-10-16T00:05:00Z",
    p_status: "selesai",
    p_result_status: "green",
    p_reasons: [] as unknown,
    p_actions: [] as unknown,
    p_interrupted: false,
    p_is_simulated: false,
    p_answers: [answer("cough_today")] as unknown,
    ...over,
  });
  const JSONB = new Set(["p_reasons", "p_actions", "p_answers"]);
  function save(payload: Record<string, unknown>) {
    const args = { p_elder_id: elder, ...payload };
    const keys = Object.keys(args);
    const sql = `select public.save_examination(${keys
      .map((k, i) => `${k} => $${i + 1}${JSONB.has(k) ? "::jsonb" : ""}`)
      .join(", ")}) id`;
    return db.query(
      sql,
      keys.map((k) => (JSONB.has(k) ? JSON.stringify(args[k as keyof typeof args]) : args[k as keyof typeof args])),
    );
  }
  async function count(table: "examinations" | "exam_answers", id: string) {
    await db.exec("reset role");
    const col = table === "examinations" ? "id" : "examination_id";
    return (await rows(`select count(*)::int c from public.${table} where ${col} = $1`, [id]))[0].c;
  }

  it("persiapan: lansia dan caregiver terhubung tanpa izin berbagi", async () => {
    await db.exec("reset role");
    for (const id of Object.values(U)) await db.query("insert into auth.users (id) values ($1)", [id]);
    await as(U.care);
    await db.query("insert into public.caregivers (id, display_name) values ($1, 'Eka')", [U.care]);
    await as(U.elder, { anonymous: true });
    elder = (await rows("select public.create_elder_profile('Bu Endah', '60-65') id"))[0].id as string;
    link = (await pair(U.elder, U.care, true, false)).linkId;
  });

  // ---------- A01: putus hubungan menutup catatan caregiver sendiri ----------

  it("caregiver mencatat pemeriksaan mode caregiver dan membacanya selama hubungan aktif", async () => {
    await as(U.care);
    await save(base({ p_id: exam, p_mode: "caregiver", p_answers: [answer("cough_today", "caregiver")] }));
    expect(await rows("select id from public.examinations where id = $1", [exam])).toHaveLength(1);
    expect(await rows("select id from public.exam_answers where examination_id = $1", [exam])).toHaveLength(1);
  });

  it("setelah lansia memutus hubungan: caregiver tidak bisa membaca pemeriksaan maupun jawabannya", async () => {
    // Satu catatan lagi saat izin berbagi menyala, supaya kedua jalur akses lama ikut diuji.
    await as(U.elder, { anonymous: true });
    await db.query("select public.set_share_results($1, true)", [link]);
    await as(U.care);
    await save(base({ p_id: examShared, p_mode: "caregiver", p_answers: [answer("cough_today", "caregiver")] }));

    await as(U.elder, { anonymous: true });
    await db.query("select public.revoke_link($1)", [link]);

    await as(U.care);
    expect(await rows("select id from public.examinations")).toEqual([]);
    expect(await rows("select id from public.exam_answers")).toEqual([]);
    expect(await rows("select public.can_view_examination($1) ok", [exam])).toEqual([{ ok: false }]);
    // Lewat embed PostgREST (examinations -> exam_answers) juga tertutup: kebijakannya sama.
    expect(
      await rows("select a.id from public.exam_answers a join public.examinations x on x.id = a.examination_id"),
    ).toEqual([]);
    // Jawaban baru tidak bisa disisipkan ke catatan lama.
    await fails(
      `insert into public.exam_answers (examination_id, position, question_id, value, label, source, answered_at)
       values ($1, 5, 'chest_check', 'tidak', 'Tidak', 'caregiver', now())`,
      [exam],
      RLS,
    );
  });

  it("data tetap milik lansia: lansia masih melihat semua pemeriksaan dan jawabannya", async () => {
    await as(U.elder, { anonymous: true });
    expect((await rows("select count(*)::int c from public.examinations"))[0].c).toBe(2);
    expect((await rows("select count(*)::int c from public.exam_answers"))[0].c).toBe(2);
  });

  it("sambung ulang yang masih pending tidak membuka catatan lama", async () => {
    await as(U.elder, { anonymous: true });
    const token = (await rows("select public.create_pairing_token() t"))[0].t as string;
    await as(U.care);
    await db.query("select public.request_pairing($1)", [token]);
    expect(await rows("select id from public.examinations")).toEqual([]);
    expect(await rows("select id from public.exam_answers")).toEqual([]);
  });

  // ---------- A04/A08: validasi payload save_examination ----------

  const invalid: [string, Record<string, unknown>][] = [
    ["jawaban lebih dari 30", { p_answers: Array.from({ length: 31 }, (_, i) => answer(`q_${i}`, "lansia", { position: i })) }],
    ["isi jawaban lebih dari 200 huruf", { p_answers: [answer("cough_today", "lansia", { value: "x".repeat(201) })] }],
    ["label jawaban kosong", { p_answers: [answer("cough_today", "lansia", { label: "" })] }],
    ["question_id berisi karakter aneh", { p_answers: [answer("cough_today'; drop table x;--")] }],
    ["jawaban bukan daftar", { p_answers: { position: 0 } }],
    ["elemen jawaban bukan objek", { p_answers: ["ya"] }],
    ["posisi jawaban berupa teks", { p_answers: [answer("cough_today", "lansia", { position: "0" })] }],
    ["sumber caregiver pada Cek Mandiri", { p_answers: [answer("cough_today", "caregiver")] }],
    ["alasan bukan daftar", { p_reasons: { level: "red" } }],
    ["alasan lebih dari 20", { p_result_status: "insufficient", p_reasons: Array.from({ length: 21 }, () => ({ ...redReason, level: "yellow", nodeId: "cough_today" })) }],
    ["alasan dengan teks lebih dari 500 huruf", { p_result_status: "yellow", p_reasons: [{ ...redReason, level: "yellow", nodeId: "cough_today", text: "x".repeat(501) }] }],
    ["tindakan bukan teks", { p_actions: [{ x: 1 }] }],
    ["tindakan lebih dari 10", { p_actions: Array.from({ length: 11 }, () => "Istirahat.") }],
    ["pohon tidak dikenal", { p_tree_id: "pohon-palsu" }],
    ["versi pohon tidak dikenal", { p_tree_version: "9.9.9" }],
    ["status hasil kosong", { p_result_status: null }],
    ["mode tidak sah", { p_mode: "admin" }],
    ["waktu selesai sebelum mulai", { p_finished_at: "2026-10-15T00:00:00Z" }],
    ["waktu mulai jauh di masa depan", { p_started_at: "2099-01-01T00:00:00Z", p_finished_at: "2099-01-01T00:05:00Z" }],
    ["selesai tanpa jawaban", { p_answers: [] }],
    ["hijau padahal ada alasan", { p_reasons: [{ ...redReason, level: "yellow", nodeId: "cough_today" }] }],
    ["hijau padahal belum selesai", { p_status: "belum_selesai", p_finished_at: null }],
    ["merah tanpa alasan merah", { p_result_status: "red", p_status: "terhenti", p_interrupted: true }],
    ["terhenti tetapi bukan merah", { p_status: "terhenti", p_interrupted: true, p_result_status: "insufficient" }],
    ["alasan menunjuk pertanyaan yang tidak dijawab", { p_result_status: "red", p_status: "terhenti", p_interrupted: true, p_reasons: [redReason] }],
  ];

  it.each(invalid)("ditolak dan tidak meninggalkan data: %s", async (_label, over) => {
    await as(U.elder, { anonymous: true });
    const id = newExamId();
    await expect(save(base({ p_id: id, ...over }))).rejects.toThrow();
    expect(await count("examinations", id)).toBe(0);
    expect(await count("exam_answers", id)).toBe(0);
  });

  it("galat di tengah penyimpanan jawaban membatalkan pemeriksaannya juga", async () => {
    await as(U.elder, { anonymous: true });
    const id = newExamId();
    // Lolos validasi bentuk, tetapi waktu jawaban bukan tanggal: gagal saat baris jawaban disisipkan.
    await expect(
      save(base({ p_id: id, p_answers: [answer("cough_today", "lansia", { answered_at: "bukan-tanggal" })] })),
    ).rejects.toThrow();
    expect(await count("examinations", id)).toBe(0);
  });

  it("payload sah tetap tersimpan: merah dengan alasan yang menunjuk ke jawabannya", async () => {
    await as(U.elder, { anonymous: true });
    const id = newExamId();
    await save(
      base({
        p_id: id,
        p_status: "terhenti",
        p_interrupted: true,
        p_result_status: "red",
        p_reasons: [redReason],
        p_actions: ["Hubungi 112 atau 119."],
        p_answers: [answer("cough_today"), answer("cough_blood", "lansia", { position: 1 })],
      }),
    );
    expect(await count("examinations", id)).toBe(1);
    expect(await count("exam_answers", id)).toBe(2);
  });

  it("versi pohon yang dipakai aplikasi sekarang dikenal database", async () => {
    await as(U.elder, { anonymous: true });
    const id = newExamId();
    await save(base({ p_id: id, p_tree_id: treeV1.id, p_tree_version: treeV1.version }));
    expect(await count("examinations", id)).toBe(1);
  });

  it("0003 bisa dijalankan dua kali (Supabase Preview)", async () => {
    await db.exec("reset role");
    await db.exec(migrations[2]);
    await as(U.care);
    expect(await rows("select id from public.examinations")).toEqual([]);
  });
});
