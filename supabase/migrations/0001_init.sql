-- ElderVital: skema awal (PostgreSQL / Supabase)
--
-- Prinsip:
-- * RLS aktif di semua tabel. Peran `anon` (tanpa login) tidak punya akses apa pun.
-- * Profil lansia tidak memakai email/password: perangkat lansia masuk lewat
--   Supabase Anonymous Sign-In, dan auth.uid() sesi itu menjadi pemilik profil.
--   Konsekuensi: bila data browser dihapus, profil tidak bisa dipulihkan tanpa
--   penghubungan ulang (sesuai spesifikasi bagian 5.3).
-- * Pairing QR: QR hanya berisi token sementara. Yang disimpan di database hanya
--   hash-nya, berlaku 10 menit, sekali pakai. Tidak ada data kesehatan di QR.
-- * Hubungan caregiver dan lansia butuh persetujuan kedua pihak: caregiver memindai
--   (status pending), lalu perangkat lansia menyetujui (status active). Keduanya
--   dapat memutus hubungan kapan saja.
-- * Caregiver hanya melihat hasil pemeriksaan bila hubungan aktif DAN lansia
--   mengizinkan berbagi hasil (share_results).
-- * Hasil skrining dihitung di klien (src/lib/screening) lalu disimpan. Database
--   belum menghitung ulang hasilnya; lihat docs/SETUP.md bagian "Batasan".
--
-- Cara pakai: tempel seluruh file ini di Supabase > SQL Editor > Run.

-- ---------------------------------------------------------------------------
-- Tabel
-- ---------------------------------------------------------------------------

create table public.caregivers (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  created_at   timestamptz not null default now()
);

create table public.elders (
  id             uuid primary key default gen_random_uuid(),
  -- auth.uid() sesi anonim di perangkat lansia
  device_user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name   text not null check (char_length(display_name) between 1 and 60),
  age_range      text check (age_range in ('50-54', '55-59', '60-65', 'lebih-65')),
  created_at     timestamptz not null default now()
);

create table public.care_links (
  id            uuid primary key default gen_random_uuid(),
  elder_id      uuid not null references public.elders (id) on delete cascade,
  caregiver_id  uuid not null references public.caregivers (id) on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending', 'active', 'rejected', 'revoked')),
  -- persetujuan lansia agar caregiver boleh melihat hasil pemeriksaan
  share_results boolean not null default false,
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  revoked_at    timestamptz,
  unique (elder_id, caregiver_id),
  check (share_results = false or status = 'active')
);

create table public.pairing_tokens (
  id         uuid primary key default gen_random_uuid(),
  elder_id   uuid not null references public.elders (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create table public.examinations (
  id            uuid primary key,  -- dibuat klien (uuid) agar pengiriman ulang aman
  elder_id      uuid not null references public.elders (id) on delete cascade,
  caregiver_id  uuid references public.caregivers (id) on delete set null,
  mode          text not null check (mode in ('mandiri', 'caregiver')),
  tree_id       text not null,
  tree_version  text not null,
  started_at    timestamptz not null,
  finished_at   timestamptz,
  status        text not null check (status in ('selesai', 'belum_selesai', 'terhenti')),
  result_status text check (result_status in ('green', 'yellow', 'red', 'insufficient')),
  reasons       jsonb not null default '[]'::jsonb,
  actions       jsonb not null default '[]'::jsonb,
  interrupted   boolean not null default false,
  -- data demo wajib berlabel simulasi
  is_simulated  boolean not null default false,
  created_at    timestamptz not null default now(),
  check ((mode = 'caregiver') = (caregiver_id is not null))
);
create index examinations_elder_idx on public.examinations (elder_id, started_at desc);

create table public.exam_answers (
  id             uuid primary key default gen_random_uuid(),
  examination_id uuid not null references public.examinations (id) on delete cascade,
  position       integer not null check (position >= 0),
  question_id    text not null,
  value          text not null,
  label          text not null,
  source         text not null check (source in ('lansia', 'caregiver')),
  is_unknown     boolean not null default false,
  answered_at    timestamptz not null,
  unique (examination_id, position),
  unique (examination_id, question_id)
);

create table public.reminder_schedules (
  id          uuid primary key default gen_random_uuid(),
  elder_id    uuid not null references public.elders (id) on delete cascade,
  label       text not null check (char_length(label) between 1 and 30),
  time_of_day time not null,
  enabled     boolean not null default true,
  unique (elder_id, label)
);

create table public.help_requests (
  id         uuid primary key default gen_random_uuid(),
  elder_id   uuid not null references public.elders (id) on delete cascade,
  status     text not null default 'open'
               check (status in ('open', 'taken', 'done', 'cancelled')),
  taken_by   uuid references public.caregivers (id) on delete set null,
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
create index help_requests_elder_idx on public.help_requests (elder_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Fungsi bantu untuk RLS (security definer agar tidak terjadi rekursi kebijakan)
-- ---------------------------------------------------------------------------

create function public.my_elder_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.elders where device_user_id = auth.uid()
$$;

create function public.owns_elder(p_elder uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.elders e
    where e.id = p_elder and e.device_user_id = auth.uid()
  )
$$;

-- Caregiver dengan hubungan aktif (boleh melihat nama dan jadwal).
create function public.is_linked_caregiver(p_elder uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.care_links l
    where l.elder_id = p_elder and l.caregiver_id = auth.uid() and l.status = 'active'
  )
$$;

-- Caregiver yang juga mendapat izin melihat hasil pemeriksaan.
create function public.can_view_results(p_elder uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.care_links l
    where l.elder_id = p_elder and l.caregiver_id = auth.uid()
      and l.status = 'active' and l.share_results
  )
$$;

create function public.can_view_examination(p_exam uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.examinations x
    where x.id = p_exam
      and (public.owns_elder(x.elder_id) or public.can_view_results(x.elder_id)
           or x.caregiver_id = auth.uid())
  )
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.caregivers         enable row level security;
alter table public.elders             enable row level security;
alter table public.care_links         enable row level security;
alter table public.pairing_tokens     enable row level security;
alter table public.examinations       enable row level security;
alter table public.exam_answers       enable row level security;
alter table public.reminder_schedules enable row level security;
alter table public.help_requests      enable row level security;

-- caregivers: akun milik sendiri; lansia boleh melihat nama caregiver yang terhubung/menunggu.
create policy caregivers_select on public.caregivers for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.care_links l
      where l.caregiver_id = caregivers.id and public.owns_elder(l.elder_id)
    )
  );
-- Hanya akun email (bukan sesi anonim) yang boleh menjadi caregiver.
create policy caregivers_insert on public.caregivers for insert to authenticated
  with check (
    id = auth.uid()
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
create policy caregivers_update on public.caregivers for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- elders: dibuat lewat create_elder_profile(); pemilik dan caregiver terhubung boleh membaca.
create policy elders_select on public.elders for select to authenticated
  using (device_user_id = auth.uid() or public.is_linked_caregiver(id));
create policy elders_update on public.elders for update to authenticated
  using (device_user_id = auth.uid()) with check (device_user_id = auth.uid());
-- Hak menghapus data: menghapus profil menghapus seluruh pemeriksaan dan hubungan (cascade).
create policy elders_delete on public.elders for delete to authenticated
  using (device_user_id = auth.uid());

-- care_links: dibaca kedua pihak; diubah hanya lewat fungsi di bawah.
create policy care_links_select on public.care_links for select to authenticated
  using (caregiver_id = auth.uid() or public.owns_elder(elder_id));

-- pairing_tokens: tanpa kebijakan = tidak bisa diakses langsung (hanya lewat fungsi).

-- examinations
create policy examinations_select on public.examinations for select to authenticated
  using (
    public.owns_elder(elder_id) or public.can_view_results(elder_id) or caregiver_id = auth.uid()
  );
create policy examinations_insert on public.examinations for insert to authenticated
  with check (
    (mode = 'mandiri' and caregiver_id is null and public.owns_elder(elder_id))
    or (mode = 'caregiver' and caregiver_id = auth.uid() and public.is_linked_caregiver(elder_id))
  );

-- exam_answers
create policy exam_answers_select on public.exam_answers for select to authenticated
  using (public.can_view_examination(examination_id));
create policy exam_answers_insert on public.exam_answers for insert to authenticated
  with check (
    exists (
      select 1 from public.examinations x
      where x.id = exam_answers.examination_id
        and (public.owns_elder(x.elder_id) or x.caregiver_id = auth.uid())
    )
  );

-- reminder_schedules: lansia mengelola; caregiver terhubung boleh membaca.
create policy reminders_select on public.reminder_schedules for select to authenticated
  using (public.owns_elder(elder_id) or public.is_linked_caregiver(elder_id));
create policy reminders_write on public.reminder_schedules for all to authenticated
  using (public.owns_elder(elder_id)) with check (public.owns_elder(elder_id));

-- help_requests: lansia membuat/membatalkan; caregiver terhubung membaca dan menanggapi.
create policy help_select on public.help_requests for select to authenticated
  using (public.owns_elder(elder_id) or public.is_linked_caregiver(elder_id));
create policy help_insert on public.help_requests for insert to authenticated
  with check (public.owns_elder(elder_id) and status = 'open' and taken_by is null);
create policy help_update_elder on public.help_requests for update to authenticated
  using (public.owns_elder(elder_id))
  with check (public.owns_elder(elder_id) and status in ('open', 'cancelled'));
create policy help_update_caregiver on public.help_requests for update to authenticated
  using (public.is_linked_caregiver(elder_id))
  with check (
    public.is_linked_caregiver(elder_id)
    and status in ('taken', 'done') and taken_by = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Fungsi yang dipanggil klien (RPC)
-- ---------------------------------------------------------------------------

-- Perangkat lansia: membuat profil untuk sesi anonim ini (idempoten).
create function public.create_elder_profile(p_name text, p_age_range text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'harus masuk terlebih dahulu' using errcode = '42501';
  end if;
  if exists (select 1 from public.caregivers where id = auth.uid()) then
    raise exception 'akun caregiver tidak bisa membuat profil lansia' using errcode = '42501';
  end if;
  select id into v_id from public.elders where device_user_id = auth.uid();
  if v_id is not null then
    return v_id;
  end if;
  insert into public.elders (device_user_id, display_name, age_range)
  values (auth.uid(), p_name, p_age_range)
  returning id into v_id;
  return v_id;
end $$;

-- Perangkat lansia: membuat token QR. Token asli hanya dikembalikan sekali di sini.
create function public.create_pairing_token()
returns text language plpgsql security definer set search_path = '' as $$
declare v_elder uuid := public.my_elder_id(); v_token text;
begin
  if v_elder is null then
    raise exception 'profil lansia belum dibuat' using errcode = 'P0001';
  end if;
  delete from public.pairing_tokens
   where elder_id = v_elder and (used_at is not null or expires_at < now());
  if (select count(*) from public.pairing_tokens where elder_id = v_elder) >= 3 then
    raise exception 'terlalu banyak token aktif, tunggu beberapa menit' using errcode = 'P0001';
  end if;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.pairing_tokens (elder_id, token_hash, expires_at)
  values (v_elder, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), now() + interval '10 minutes');
  return v_token;
end $$;

-- Caregiver: melihat nama lansia dari token tanpa memakainya (untuk layar konfirmasi).
create function public.preview_pairing(p_token text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  if not exists (select 1 from public.caregivers where id = auth.uid()) then
    raise exception 'hanya caregiver yang dapat menghubungkan' using errcode = '42501';
  end if;
  select e.display_name into v_name
    from public.pairing_tokens t join public.elders e on e.id = t.elder_id
   where t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
     and t.used_at is null and t.expires_at > now();
  if v_name is null then
    raise exception 'token tidak valid atau sudah kedaluwarsa' using errcode = 'P0001';
  end if;
  return v_name;
end $$;

-- Caregiver: memakai token. Hubungan menjadi pending sampai lansia menyetujui.
create function public.request_pairing(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_tok public.pairing_tokens;
  v_link public.care_links;
begin
  if not exists (select 1 from public.caregivers where id = auth.uid()) then
    raise exception 'hanya caregiver yang dapat menghubungkan' using errcode = '42501';
  end if;
  select * into v_tok from public.pairing_tokens
   where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') for update;
  if not found or v_tok.used_at is not null or v_tok.expires_at <= now() then
    raise exception 'token tidak valid atau sudah kedaluwarsa' using errcode = 'P0001';
  end if;
  update public.pairing_tokens set used_at = now() where id = v_tok.id;

  select * into v_link from public.care_links
   where elder_id = v_tok.elder_id and caregiver_id = auth.uid();
  if found and v_link.status = 'active' then
    return v_link.id;
  end if;
  insert into public.care_links (elder_id, caregiver_id, status)
  values (v_tok.elder_id, auth.uid(), 'pending')
  on conflict (elder_id, caregiver_id)
  do update set status = 'pending', share_results = false, decided_at = null, revoked_at = null
  returning id into v_link.id;
  return v_link.id;
end $$;

-- Perangkat lansia: menyetujui atau menolak, dan menentukan apakah hasil boleh dilihat.
create function public.decide_link(p_link_id uuid, p_approve boolean, p_share_results boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare v_link public.care_links;
begin
  select * into v_link from public.care_links where id = p_link_id for update;
  if not found or not public.owns_elder(v_link.elder_id) then
    raise exception 'hubungan tidak ditemukan' using errcode = '42501';
  end if;
  if v_link.status <> 'pending' then
    raise exception 'hubungan ini sudah diputuskan' using errcode = 'P0001';
  end if;
  update public.care_links
     set status = case when p_approve then 'active' else 'rejected' end,
         share_results = p_approve and coalesce(p_share_results, false),
         decided_at = now()
   where id = p_link_id;
end $$;

-- Perangkat lansia: mengubah izin berbagi hasil pada hubungan yang aktif.
create function public.set_share_results(p_link_id uuid, p_share boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_link public.care_links;
begin
  select * into v_link from public.care_links where id = p_link_id for update;
  if not found or not public.owns_elder(v_link.elder_id) then
    raise exception 'hubungan tidak ditemukan' using errcode = '42501';
  end if;
  if v_link.status <> 'active' then
    raise exception 'hubungan belum aktif' using errcode = 'P0001';
  end if;
  update public.care_links set share_results = p_share where id = p_link_id;
end $$;

-- Lansia atau caregiver: memutus hubungan. Izin berbagi otomatis dicabut.
create function public.revoke_link(p_link_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_link public.care_links;
begin
  select * into v_link from public.care_links where id = p_link_id for update;
  if not found or not (public.owns_elder(v_link.elder_id) or v_link.caregiver_id = auth.uid()) then
    raise exception 'hubungan tidak ditemukan' using errcode = '42501';
  end if;
  update public.care_links
     set status = 'revoked', share_results = false, revoked_at = now()
   where id = p_link_id;
end $$;

-- Menyimpan satu pemeriksaan beserta jawabannya dalam satu transaksi.
-- Berjalan sebagai pemanggil (security invoker), jadi RLS tetap berlaku.
-- Idempoten: id yang sama tidak membuat data ganda.
create function public.save_examination(
  p_id uuid, p_elder_id uuid, p_mode text, p_tree_id text, p_tree_version text,
  p_started_at timestamptz, p_finished_at timestamptz, p_status text, p_result_status text,
  p_reasons jsonb, p_actions jsonb, p_interrupted boolean, p_is_simulated boolean,
  p_answers jsonb
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_inserted integer;
begin
  insert into public.examinations (
    id, elder_id, caregiver_id, mode, tree_id, tree_version, started_at, finished_at,
    status, result_status, reasons, actions, interrupted, is_simulated
  ) values (
    p_id, p_elder_id,
    case when p_mode = 'caregiver' then auth.uid() else null end,
    p_mode, p_tree_id, p_tree_version, p_started_at, p_finished_at,
    p_status, p_result_status, coalesce(p_reasons, '[]'::jsonb), coalesce(p_actions, '[]'::jsonb),
    coalesce(p_interrupted, false), coalesce(p_is_simulated, false)
  ) on conflict (id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 1 then
    insert into public.exam_answers
      (examination_id, position, question_id, value, label, source, is_unknown, answered_at)
    select p_id, a.position, a.question_id, a.value, a.label, a.source,
           coalesce(a.is_unknown, false), a.answered_at
      from jsonb_to_recordset(coalesce(p_answers, '[]'::jsonb)) as a(
        position integer, question_id text, value text, label text,
        source text, is_unknown boolean, answered_at timestamptz
      );
  end if;
  return p_id;
end $$;

-- ---------------------------------------------------------------------------
-- Hak akses fungsi dan tabel
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from public, anon;

grant select, insert, update, delete on
  public.caregivers, public.elders, public.care_links, public.examinations,
  public.exam_answers, public.reminder_schedules, public.help_requests
  to authenticated;
-- Kebijakan RLS membatasi baris mana yang boleh; daftar kolom/aksi diperketat di sini.
revoke insert, update, delete on public.care_links from authenticated;
revoke insert on public.elders from authenticated;
revoke update, delete on public.examinations from authenticated;
revoke update, delete on public.exam_answers from authenticated;
revoke delete on public.caregivers from authenticated;
revoke delete on public.help_requests from authenticated;

grant execute on function
  public.my_elder_id(), public.owns_elder(uuid), public.is_linked_caregiver(uuid),
  public.can_view_results(uuid), public.can_view_examination(uuid),
  public.create_elder_profile(text, text), public.create_pairing_token(),
  public.preview_pairing(text), public.request_pairing(text),
  public.decide_link(uuid, boolean, boolean), public.set_share_results(uuid, boolean),
  public.revoke_link(uuid),
  public.save_examination(uuid, uuid, text, text, text, timestamptz, timestamptz, text, text,
                          jsonb, jsonb, boolean, boolean, jsonb)
  to authenticated;

-- Realtime untuk permintaan bantuan (tersedia di Supabase; dilewati bila tidak ada).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.help_requests;
  end if;
end $$;
