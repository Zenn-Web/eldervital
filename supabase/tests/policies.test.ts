/**
 * Uji kebijakan keamanan database (RLS) tanpa perlu proyek Supabase.
 *
 * Memakai PGlite (PostgreSQL asli yang berjalan di WebAssembly). Skema `auth`
 * Supabase ditiru secukupnya: tabel auth.users, auth.uid(), auth.jwt(), dan peran
 * anon/authenticated. Migrasi yang diuji adalah file yang sama dengan yang
 * ditempel ke Supabase.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(new URL("../migrations/0001_init.sql", import.meta.url)),
  "utf8",
);

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

async function fails(sql: string, params: unknown[] = []) {
  await expect(db.query(sql, params)).rejects.toThrow();
}

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
  await db.exec(migration);

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
    await db.query("select public.save_examination($1,$2,'mandiri','gejala-dasar','1.0.0-demo',now(),now(),'selesai','green','[]','[]',false,true,'[]')",
      ["11111111-1111-1111-1111-111111111111", elder]);
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
      "select public.save_examination($1,$2,'mandiri','t','1',now(),now(),'selesai','green','[]','[]',false,true,'[]')",
      ["33333333-3333-3333-3333-333333333333", other],
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
      "select public.save_examination($1,$2,'caregiver','t','1',now(),now(),'selesai','green','[]','[]',false,true,'[]')",
      ["44444444-4444-4444-4444-444444444444", elder],
    );
  });

  it("caregiver terhubung dapat mencatat pemeriksaan mode caregiver dan tetap bisa membacanya", async () => {
    await pair(ids.elderA, ids.careX, true, false);
    const elder = await elderIdOf(ids.elderA);
    await as(ids.careX);
    await db.query(
      "select public.save_examination($1,$2,'caregiver','t','1',now(),now(),'selesai','yellow','[]','[]',false,true,'[]')",
      ["55555555-5555-5555-5555-555555555555", elder],
    );
    const r = await rows("select mode, caregiver_id from public.examinations");
    expect(r).toEqual([{ mode: "caregiver", caregiver_id: ids.careX }]);
  });

  it("caregiver tidak bisa menyamar sebagai mandiri", async () => {
    const elder = await elderIdOf(ids.elderA);
    await as(ids.careX);
    await fails(
      "select public.save_examination($1,$2,'mandiri','t','1',now(),now(),'selesai','green','[]','[]',false,true,'[]')",
      ["66666666-6666-6666-6666-666666666666", elder],
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
