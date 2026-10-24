-- ElderVital: pengetatan keamanan (OWASP A01, A04/A08).
--
-- 1. A01 Broken Access Control. Sebelumnya caregiver yang pernah mencatat pemeriksaan mode
--    caregiver tetap bisa membaca pemeriksaan dan jawabannya walau hubungan sudah diputus,
--    karena kebijakan cukup memeriksa caregiver_id = auth.uid(). Sekarang catatan sendiri
--    hanya terlihat selama hubungan masih AKTIF. Pemeriksaan lain (Cek Mandiri lansia) tetap
--    butuh hubungan aktif DAN izin berbagi hasil (can_view_results), tidak berubah.
--
-- 2. A04/A08 integritas data. save_examination menolak payload yang bentuknya tidak sah,
--    terlalu besar, atau tidak konsisten dengan aturan mesin pohon keputusan, SEBELUM
--    menyentuh tabel. Seluruh fungsi berjalan dalam satu transaksi: galat apa pun
--    membatalkan semuanya, tidak ada data setengah tersimpan.
--
--    Batasan yang diakui: hasil skrining tetap DIHITUNG DI KLIEN. Pemeriksaan di sini hanya
--    menjamin bentuk dan konsistensi (mis. hijau tidak boleh punya alasan, merah wajib punya
--    alasan merah, setiap alasan menunjuk ke pertanyaan yang dijawab), bukan bahwa hasilnya
--    benar menurut pohon. Klien yang dimodifikasi masih bisa mengirim hasil yang konsisten
--    tetapi tidak sesuai jawaban. Lihat docs/SECURITY.md.
--
-- Aman dijalankan ulang (Supabase Preview): create or replace dan drop policy if exists.

-- ---------------------------------------------------------------------------
-- A01: akses caregiver ke pemeriksaan hanya selama hubungan aktif
-- ---------------------------------------------------------------------------

create or replace function public.can_view_examination(p_exam uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.examinations x
    where x.id = p_exam
      and (public.owns_elder(x.elder_id)
           or public.can_view_results(x.elder_id)
           or (x.caregiver_id = auth.uid() and public.is_linked_caregiver(x.elder_id)))
  )
$$;

drop policy if exists examinations_select on public.examinations;
create policy examinations_select on public.examinations for select to authenticated
  using (
    public.owns_elder(elder_id)
    or public.can_view_results(elder_id)
    or (caregiver_id = auth.uid() and public.is_linked_caregiver(elder_id))
  );

drop policy if exists exam_answers_insert on public.exam_answers;
create policy exam_answers_insert on public.exam_answers for insert to authenticated
  with check (
    exists (
      select 1 from public.examinations x
      where x.id = exam_answers.examination_id
        and (public.owns_elder(x.elder_id)
             or (x.caregiver_id = auth.uid() and public.is_linked_caregiver(x.elder_id)))
    )
  );

-- ---------------------------------------------------------------------------
-- A04/A08: validasi payload save_examination
-- ---------------------------------------------------------------------------

create or replace function public.save_examination(
  p_id uuid, p_elder_id uuid, p_mode text, p_tree_id text, p_tree_version text,
  p_started_at timestamptz, p_finished_at timestamptz, p_status text, p_result_status text,
  p_reasons jsonb, p_actions jsonb, p_interrupted boolean, p_is_simulated boolean,
  p_answers jsonb
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  -- Batas jauh di atas kebutuhan pohon saat ini (9 pertanyaan, teks terpanjang 180 huruf).
  c_max_answers constant integer := 30;
  c_max_reasons constant integer := 20;
  c_max_actions constant integer := 10;
  c_max_text    constant integer := 500;
  c_max_value   constant integer := 200;
  v_reasons  jsonb := coalesce(p_reasons, '[]'::jsonb);
  v_actions  jsonb := coalesce(p_actions, '[]'::jsonb);
  v_answers  jsonb := coalesce(p_answers, '[]'::jsonb);
  v_source   text;
  v_item     jsonb;
  v_key      text;
  v_ids      text[] := '{}';
  v_inserted integer;
begin
  -- ----- Nilai tunggal -----
  if p_id is null or p_elder_id is null then
    raise exception 'id pemeriksaan dan id lansia harus diisi' using errcode = '22023';
  end if;
  if p_mode is null or p_mode not in ('mandiri', 'caregiver') then
    raise exception 'mode pemeriksaan tidak sah' using errcode = '22023';
  end if;
  if p_status is null or p_status not in ('selesai', 'belum_selesai', 'terhenti') then
    raise exception 'status pemeriksaan tidak sah' using errcode = '22023';
  end if;
  if p_result_status is null or p_result_status not in ('green', 'yellow', 'red', 'insufficient') then
    raise exception 'status hasil tidak sah' using errcode = '22023';
  end if;
  -- Daftar pohon yang dikenal. Setiap versi baru tree.v1.ts WAJIB ditambahkan di sini lewat
  -- migrasi baru; tes "payload penyimpanan dari klien" gagal bila lupa.
  if (p_tree_id, p_tree_version) not in (
    ('gejala-dasar', '1.0.0-demo'),
    ('gejala-dasar', '1.1.0-demo'),
    ('gejala-dasar', '1.2.0-demo')
  ) then
    raise exception 'versi pohon pertanyaan tidak dikenal' using errcode = '22023';
  end if;
  if p_started_at is null or p_started_at > now() + interval '1 day' then
    raise exception 'waktu mulai pemeriksaan tidak sah' using errcode = '22023';
  end if;
  if p_finished_at is not null and p_finished_at < p_started_at then
    raise exception 'waktu selesai tidak boleh sebelum waktu mulai' using errcode = '22023';
  end if;
  if p_status <> 'belum_selesai' and p_finished_at is null then
    raise exception 'pemeriksaan yang selesai harus punya waktu selesai' using errcode = '22023';
  end if;

  -- ----- Bentuk JSON dan ukuran -----
  if jsonb_typeof(v_answers) <> 'array' or jsonb_typeof(v_reasons) <> 'array'
     or jsonb_typeof(v_actions) <> 'array' then
    raise exception 'jawaban, alasan, dan tindakan harus berupa daftar' using errcode = '22023';
  end if;
  if jsonb_array_length(v_answers) > c_max_answers then
    raise exception 'jumlah jawaban terlalu banyak' using errcode = '22023';
  end if;
  if jsonb_array_length(v_reasons) > c_max_reasons then
    raise exception 'jumlah alasan terlalu banyak' using errcode = '22023';
  end if;
  if jsonb_array_length(v_actions) > c_max_actions then
    raise exception 'jumlah tindakan terlalu banyak' using errcode = '22023';
  end if;

  v_source := case when p_mode = 'caregiver' then 'caregiver' else 'lansia' end;
  for v_item in select value from jsonb_array_elements(v_answers) loop
    if jsonb_typeof(v_item) <> 'object'
       or jsonb_typeof(v_item -> 'position') is distinct from 'number'
       or jsonb_typeof(v_item -> 'question_id') is distinct from 'string'
       or jsonb_typeof(v_item -> 'value') is distinct from 'string'
       or jsonb_typeof(v_item -> 'label') is distinct from 'string'
       or jsonb_typeof(v_item -> 'source') is distinct from 'string'
       or jsonb_typeof(v_item -> 'answered_at') is distinct from 'string'
       or coalesce(jsonb_typeof(v_item -> 'is_unknown'), 'boolean') not in ('boolean', 'null') then
      raise exception 'bentuk jawaban tidak sah' using errcode = '22023';
    end if;
    if (v_item ->> 'question_id') !~ '^[a-z][a-z0-9_]{0,63}$'
       or char_length(v_item ->> 'value') not between 1 and c_max_value
       or char_length(v_item ->> 'label') not between 1 and c_max_value then
      raise exception 'isi jawaban tidak sah atau terlalu panjang' using errcode = '22023';
    end if;
    -- Cek Mandiri dijawab lansia, mode caregiver dijawab caregiver (sama dengan ScreeningFlow).
    if v_item ->> 'source' <> v_source then
      raise exception 'sumber jawaban tidak sesuai mode pemeriksaan' using errcode = '22023';
    end if;
    v_ids := v_ids || (v_item ->> 'question_id');
  end loop;
  if p_status <> 'belum_selesai' and jsonb_array_length(v_answers) = 0 then
    raise exception 'pemeriksaan yang selesai harus punya jawaban' using errcode = '22023';
  end if;

  for v_item in select value from jsonb_array_elements(v_reasons) loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'bentuk alasan tidak sah' using errcode = '22023';
    end if;
    foreach v_key in array array['ruleId', 'level', 'nodeId', 'question', 'answerLabel', 'text'] loop
      if jsonb_typeof(v_item -> v_key) is distinct from 'string'
         or char_length(v_item ->> v_key) not between 1 and c_max_text then
        raise exception 'bentuk alasan tidak sah' using errcode = '22023';
      end if;
    end loop;
    if v_item ->> 'level' not in ('yellow', 'red') then
      raise exception 'tingkat alasan tidak sah' using errcode = '22023';
    end if;
    -- Ketertelusuran: setiap alasan harus menunjuk ke pertanyaan yang benar-benar dijawab.
    if not (v_item ->> 'nodeId' = any (v_ids)) then
      raise exception 'alasan tidak menunjuk ke jawaban yang tersimpan' using errcode = '22023';
    end if;
  end loop;

  for v_item in select value from jsonb_array_elements(v_actions) loop
    if jsonb_typeof(v_item) is distinct from 'string'
       or char_length(v_item #>> '{}') not between 1 and c_max_text then
      raise exception 'bentuk tindakan tidak sah' using errcode = '22023';
    end if;
  end loop;

  -- ----- Konsistensi dengan aturan mesin keputusan (engine.ts evaluate) -----
  -- Merah: wajib ada alasan merah. Kuning: wajib alasan kuning, tanpa merah, dan pemeriksaan
  -- selesai. Hijau: hanya bila selesai dan tanpa alasan apa pun. Terhenti selalu merah.
  if coalesce(p_interrupted, false) <> (p_status = 'terhenti')
     or (p_status = 'terhenti' and p_result_status <> 'red') then
    raise exception 'hanya pemeriksaan merah yang boleh terhenti' using errcode = '22023';
  end if;
  if p_result_status = 'red'
     and not jsonb_path_exists(v_reasons, '$[*] ? (@.level == "red")') then
    raise exception 'hasil merah harus punya alasan merah' using errcode = '22023';
  end if;
  if p_result_status = 'yellow' and (
       p_status <> 'selesai'
       or not jsonb_path_exists(v_reasons, '$[*] ? (@.level == "yellow")')
       or jsonb_path_exists(v_reasons, '$[*] ? (@.level == "red")')) then
    raise exception 'hasil kuning tidak konsisten dengan alasannya' using errcode = '22023';
  end if;
  if p_result_status = 'green' and (p_status <> 'selesai' or jsonb_array_length(v_reasons) > 0) then
    raise exception 'hasil hijau hanya untuk pemeriksaan selesai tanpa alasan' using errcode = '22023';
  end if;
  if p_result_status = 'insufficient' and jsonb_path_exists(v_reasons, '$[*] ? (@.level == "red")') then
    raise exception 'hasil dengan alasan merah harus merah' using errcode = '22023';
  end if;

  -- ----- Simpan (sama seperti 0001) -----
  insert into public.examinations (
    id, elder_id, caregiver_id, mode, tree_id, tree_version, started_at, finished_at,
    status, result_status, reasons, actions, interrupted, is_simulated
  ) values (
    p_id, p_elder_id,
    case when p_mode = 'caregiver' then auth.uid() else null end,
    p_mode, p_tree_id, p_tree_version, p_started_at, p_finished_at,
    p_status, p_result_status, v_reasons, v_actions,
    coalesce(p_interrupted, false), coalesce(p_is_simulated, false)
  ) on conflict (id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 1 then
    insert into public.exam_answers
      (examination_id, position, question_id, value, label, source, is_unknown, answered_at)
    select p_id, a.position, a.question_id, a.value, a.label, a.source,
           coalesce(a.is_unknown, false), a.answered_at
      from jsonb_to_recordset(v_answers) as a(
        position integer, question_id text, value text, label text,
        source text, is_unknown boolean, answered_at timestamptz
      );
  end if;
  return p_id;
end $$;
