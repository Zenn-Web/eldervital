// Uji ujung ke ujung ElderVital ke Supabase ASLI, memakai kunci publik seperti aplikasi:
// Auth (email + anonim), API, RLS, RPC, Realtime, trigger 0002, dan pengetatan 0003.
//
//   npm run smoke:e2e        (membaca .env.local)
//
// PERHATIAN: skrip ini MENULIS ke database yang dipakai demo. Semua data uji berlabel
// "(simulasi)" dan is_simulated = true, dan profil lansia uji dihapus di akhir (cascade).
// Yang TERSISA dan perlu dihapus manual di Supabase > Authentication > Users:
//   - 1 akun caregiver uji-e2e-<waktu>@example.com (beserta baris caregivers-nya)
//   - 1 pengguna anonim kosong
// Syarat: "Allow anonymous sign-ins" menyala dan "Confirm email" mati.
// Tidak ikut `npm run check` karena butuh jaringan dan database sungguhan.
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!URL || !KEY) throw new Error("env Supabase tidak terbaca");
const mk = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "LULUS" : "GAGAL"}  ${name}${detail ? "  (" + detail + ")" : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const E = mk(); // perangkat lansia
const C = mk(); // caregiver
const X = mk(); // tanpa login
let elderId = null;
let realtimeChannel = null;

try {
  // ---------- Auth ----------
  const a = await E.auth.signInAnonymously();
  check("lansia masuk anonim", !a.error && a.data.user?.is_anonymous === true, a.error?.message);
  const p = await E.rpc("create_elder_profile", { p_name: "Uji E2E (simulasi)", p_age_range: "60-65" });
  elderId = p.data;
  check("profil lansia dibuat lewat RPC", !p.error && !!elderId, p.error?.message);
  const p2 = await E.rpc("create_elder_profile", { p_name: "Uji E2E (simulasi)", p_age_range: "60-65" });
  check("buat profil dua kali tidak membuat dobel", p2.data === elderId, p2.error?.message);

  const anonCg = await E.from("caregivers").insert({ id: a.data.user.id, display_name: "Penyusup" });
  check("sesi anonim ditolak menjadi caregiver", !!anonCg.error, anonCg.error?.code);

  const email = `uji-e2e-${Date.now()}@example.com`;
  const s = await C.auth.signUp({ email, password: randomUUID(), options: { data: { display_name: "Caregiver Uji (simulasi)" } } });
  if (s.error || !s.data.session) {
    check("caregiver daftar dan langsung punya sesi", false, s.error?.message ?? "butuh konfirmasi email (matikan 'Confirm email')");
    throw new Error("berhenti: caregiver tidak punya sesi");
  }
  check("caregiver daftar dan langsung punya sesi", true);
  const cid = s.data.user.id;
  const ci = await C.from("caregivers").insert({ id: cid, display_name: "Caregiver Uji (simulasi)" });
  check("baris caregivers dibuat", !ci.error, ci.error?.message);

  const anonRead = await X.from("elders").select("id");
  check("tanpa login tidak bisa membaca profil", !!anonRead.error || (anonRead.data ?? []).length === 0, anonRead.error?.code ?? `${anonRead.data?.length} baris`);
  const anonRpc = await X.rpc("create_pairing_token");
  check("tanpa login tidak bisa memanggil RPC", !!anonRpc.error, anonRpc.error?.code);

  // ---------- Pairing ----------
  const t = await E.rpc("create_pairing_token");
  check("token pairing dibuat (64 heksadesimal)", /^[0-9a-f]{64}$/.test(t.data ?? ""), t.error?.message);
  const bad = await C.rpc("preview_pairing", { p_token: "0".repeat(64) });
  check("token palsu ditolak", !!bad.error, bad.error?.message);
  const pv = await C.rpc("preview_pairing", { p_token: t.data });
  check("preview menampilkan nama lansia", pv.data === "Uji E2E (simulasi)", pv.error?.message);
  const rq = await C.rpc("request_pairing", { p_token: t.data });
  const linkId = rq.data;
  check("caregiver mengirim permintaan", !rq.error && !!linkId, rq.error?.message);
  const reuse = await C.rpc("request_pairing", { p_token: t.data });
  check("token tidak bisa dipakai dua kali", !!reuse.error, reuse.error?.message);
  const pend = await C.from("elders").select("id");
  check("selama pending caregiver tidak melihat profil lansia", (pend.data ?? []).length === 0);
  const el = await E.from("care_links").select("status, caregivers(display_name)").eq("id", linkId).single();
  check("lansia melihat nama caregiver yang menunggu", el.data?.status === "pending" && JSON.stringify(el.data).includes("Caregiver Uji"), el.error?.message);
  const selfApprove = await C.rpc("decide_link", { p_link_id: linkId, p_approve: true, p_share_results: true });
  check("caregiver tidak bisa menyetujui dirinya sendiri", !!selfApprove.error, selfApprove.error?.code);
  const dec = await E.rpc("decide_link", { p_link_id: linkId, p_approve: true, p_share_results: false });
  check("lansia menyetujui tanpa berbagi hasil", !dec.error, dec.error?.message);
  const selfShare = await C.rpc("set_share_results", { p_link_id: linkId, p_share: true });
  check("caregiver tidak bisa memberi dirinya izin berbagi", !!selfShare.error, selfShare.error?.code);

  // ---------- Simpan pemeriksaan ----------
  const examId = randomUUID();
  const args = {
    p_id: examId, p_elder_id: elderId, p_mode: "mandiri", p_tree_id: "gejala-dasar", p_tree_version: "1.2.0-demo",
    p_started_at: new Date(Date.now() - 60000).toISOString(), p_finished_at: new Date().toISOString(),
    p_status: "terhenti", p_result_status: "red",
    p_reasons: [{ ruleId: "R-COUGH-BLOOD", level: "red", nodeId: "cough_blood", question: "Apakah batuk Anda mengeluarkan darah?", answerLabel: "Ya", text: "Batuk disertai darah." }],
    p_actions: ["Hubungi 112 atau 119."], p_interrupted: true, p_is_simulated: true,
    p_answers: [
      { position: 0, question_id: "cough_today", value: "ya", label: "Ya", source: "lansia", is_unknown: false, answered_at: new Date().toISOString() },
      { position: 1, question_id: "cough_blood", value: "ya", label: "Ya", source: "lansia", is_unknown: false, answered_at: new Date().toISOString() },
    ],
  };
  const sv = await E.rpc("save_examination", args);
  check("lansia menyimpan pemeriksaan (berlabel simulasi)", sv.data === examId, sv.error?.message);
  // Kirim ulang dengan isi berbeda tetapi SAH (selesai, data tidak cukup, tanpa alasan): diterima
  // tanpa galat, tetapi isi yang sudah tersimpan tidak berubah.
  const sv2 = await E.rpc("save_examination", {
    ...args, p_status: "selesai", p_result_status: "insufficient", p_reasons: [], p_actions: [], p_interrupted: false,
  });
  const mine = await E.from("examinations").select("result_status, is_simulated").eq("id", examId);
  check(
    "kirim ulang tidak menggandakan dan tidak menimpa",
    !sv2.error && mine.data?.length === 1 && mine.data[0].result_status === "red" && mine.data[0].is_simulated === true,
    sv2.error?.message ?? `${mine.data?.length} baris, hasil ${mine.data?.[0]?.result_status}`,
  );
  const forged = await E.rpc("save_examination", {
    ...args, p_id: randomUUID(), p_status: "selesai", p_result_status: "green", p_interrupted: false,
  });
  check("hasil hijau dengan alasan merah ditolak (0003)", !!forged.error, forged.error?.message);
  const invalid = await E.rpc("save_examination", { ...args, p_id: randomUUID(), p_status: "completed" });
  check("status tidak sah ditolak database", !!invalid.error, invalid.error?.code);

  // ---------- Izin berbagi: sebelum dan sesudah ----------
  const seen = async () => ((await C.from("examinations").select("id").eq("elder_id", elderId).eq("mode", "mandiri")).data ?? []).length;
  check("izin mati: caregiver tidak melihat hasil", (await seen()) === 0);
  await E.rpc("set_share_results", { p_link_id: linkId, p_share: true });
  const withAnswers = await C.from("examinations").select("id, exam_answers(question_id)").eq("id", examId).maybeSingle();
  check("izin hidup: caregiver melihat hasil beserta jawaban", withAnswers.data?.exam_answers?.length === 2, withAnswers.error?.message);
  await E.rpc("set_share_results", { p_link_id: linkId, p_share: false });
  check("izin dimatikan lagi: hasil tertutup lagi", (await seen()) === 0);

  // ---------- Minta bantuan + Realtime ----------
  let gotEvent = false;
  realtimeChannel = C.channel("uji-help-" + randomUUID())
    .on("postgres_changes", { event: "*", schema: "public", table: "help_requests" }, () => { gotEvent = true; });
  const subStatus = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve("tidak ada jawaban dalam 15 detik"), 15000);
    realtimeChannel.subscribe((st, err) => {
      if (st === "SUBSCRIBED" || st === "CHANNEL_ERROR" || st === "TIMED_OUT" || st === "CLOSED") {
        clearTimeout(timer);
        resolve(err ? `${st}: ${err.message}` : st);
      }
    });
  });
  check("caregiver berlangganan Realtime", subStatus === "SUBSCRIBED", subStatus);
  // Server Realtime butuh sesaat setelah SUBSCRIBED sebelum perubahan pertama terkirim.
  await sleep(2000);
  const hr = await E.from("help_requests").insert({ elder_id: elderId }).select("id").single();
  check("lansia membuat permintaan bantuan", !hr.error, hr.error?.message);
  for (let i = 0; i < 30 && !gotEvent; i++) await sleep(500);
  check("caregiver menerima event Realtime", gotEvent, gotEvent ? "" : "tidak ada event dalam 15 detik");
  const take1 = await C.from("help_requests").update({ status: "taken", taken_by: cid }).eq("id", hr.data.id).eq("status", "open").select("id");
  const take2 = await C.from("help_requests").update({ status: "taken", taken_by: cid }).eq("id", hr.data.id).eq("status", "open").select("id");
  check("menanggapi: hanya sekali berhasil", take1.data?.length === 1 && take2.data?.length === 0, take1.error?.message);
  const jump = await E.from("help_requests").update({ status: "done" }).eq("id", hr.data.id);
  check("lansia tidak bisa menandai selesai (trigger 0002)", !!jump.error, jump.error?.code);
  const done = await C.from("help_requests").update({ status: "done", handled_at: new Date().toISOString() }).eq("id", hr.data.id).select("status");
  check("caregiver penanggap menandai selesai", done.data?.[0]?.status === "done", done.error?.message);

  // ---------- Jadwal ----------
  const rem = await E.from("reminder_schedules").upsert([{ elder_id: elderId, label: "Pagi", time_of_day: "07:00", enabled: true }], { onConflict: "elder_id,label" });
  check("lansia menyimpan jadwal", !rem.error, rem.error?.message);
  const cgRem = await C.from("reminder_schedules").select("id").eq("elder_id", elderId);
  const cgEdit = await C.from("reminder_schedules").update({ enabled: false }).eq("elder_id", elderId).select("id");
  check("caregiver bisa membaca jadwal tapi tidak mengubah", cgRem.data?.length === 1 && (cgEdit.data ?? []).length === 0);

  // ---------- Catatan mode caregiver (0003) ----------
  const cgArgs = {
    ...args,
    p_id: randomUUID(),
    p_mode: "caregiver",
    p_answers: args.p_answers.map((a) => ({ ...a, source: "caregiver" })),
  };
  const cgOwn = await C.rpc("save_examination", cgArgs);
  const cgRead = await C.from("examinations").select("id, exam_answers(id)").eq("id", cgArgs.p_id);
  check(
    "caregiver mencatat pemeriksaan mode caregiver dan membacanya selama terhubung",
    !cgOwn.error && cgRead.data?.length === 1 && cgRead.data[0].exam_answers.length === 2,
    cgOwn.error?.message ?? cgRead.error?.message,
  );

  // ---------- Putus hubungan ----------
  const rv = await C.rpc("revoke_link", { p_link_id: linkId });
  check("caregiver memutus hubungan", !rv.error, rv.error?.message);
  const after = await Promise.all([
    C.from("elders").select("id"),
    C.from("reminder_schedules").select("id").eq("elder_id", elderId),
    C.from("help_requests").select("id").eq("elder_id", elderId),
  ]);
  check("setelah putus: profil, jadwal, dan bantuan tertutup", after.every((r) => (r.data ?? []).length === 0));
  const [ownAfter, answersAfter] = await Promise.all([
    C.from("examinations").select("id").eq("id", cgArgs.p_id),
    C.from("exam_answers").select("id").eq("examination_id", cgArgs.p_id),
  ]);
  check(
    "setelah putus: catatan mode caregiver miliknya sendiri juga tertutup (0003)",
    (ownAfter.data ?? []).length === 0 && (answersAfter.data ?? []).length === 0,
    `${ownAfter.data?.length ?? "?"} pemeriksaan, ${answersAfter.data?.length ?? "?"} jawaban terlihat`,
  );
  // Payload sah (sumber jawaban caregiver), jadi yang menolak adalah RLS (42501), bukan validasi.
  const cgSave = await C.rpc("save_examination", { ...cgArgs, p_id: randomUUID() });
  check("setelah putus: caregiver tidak bisa menyimpan pemeriksaan", cgSave.error?.code === "42501", cgSave.error?.code);
} catch (e) {
  console.log("BERHENTI:", e.message);
} finally {
  if (realtimeChannel) await C.removeChannel(realtimeChannel);
  // ---------- Bersih-bersih ----------
  if (elderId) {
    const del = await E.from("elders").delete().eq("id", elderId);
    const left = await E.from("examinations").select("id").eq("elder_id", elderId);
    check("bersih-bersih: profil lansia uji dan seluruh datanya dihapus", !del.error && (left.data ?? []).length === 0, del.error?.message);
  }
  await E.auth.signOut();
  await C.auth.signOut();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nRingkasan: ${results.length - failed} lulus, ${failed} gagal dari ${results.length} pemeriksaan.`);
  process.exit(failed ? 1 : 0);
}
