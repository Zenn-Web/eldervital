-- ElderVital: memperketat perubahan status permintaan bantuan.
--
-- Kebijakan RLS help_update_* di 0001 hanya memeriksa NILAI BARU (mis. caregiver hanya
-- boleh menulis status 'taken'/'done' dengan taken_by = dirinya). Nilai lama tidak
-- diperiksa, sehingga lewat API langsung:
--   * caregiver terhubung bisa mengambil alih permintaan yang sudah ditanggapi
--     caregiver lain, atau menghidupkan lagi permintaan yang sudah dibatalkan;
--   * lansia bisa membuka lagi permintaan yang sudah selesai.
-- RLS tidak bisa membandingkan nilai lama dan baru, jadi aturan transisi dijaga trigger.
--
-- Transisi yang diizinkan (selain itu ditolak):
--   open  -> taken      caregiver menanggapi (taken_by wajib terisi)
--   open  -> cancelled  lansia membatalkan
--   taken -> done       caregiver yang menanggapi menandai selesai (taken_by tidak berubah)
--   taken -> cancelled  lansia membatalkan
-- Status sama (mis. hanya handled_at berubah) boleh, asal taken_by tidak berubah.
-- Kolom elder_id dan created_at tidak pernah boleh diubah.
--
-- Ini hanya memperketat: tidak ada akses baru yang dibuka.
-- Cara pakai: tempel seluruh file ini di Supabase > SQL Editor > Run (sekali saja).

create function public.check_help_request_transition()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.elder_id is distinct from old.elder_id or new.created_at is distinct from old.created_at then
    raise exception 'data permintaan bantuan tidak boleh diubah' using errcode = '42501';
  end if;

  if new.status = old.status then
    if new.taken_by is distinct from old.taken_by then
      raise exception 'permintaan ini sudah ditanggapi caregiver lain' using errcode = '42501';
    end if;
    return new;
  end if;

  if (old.status = 'open' and new.status = 'taken' and new.taken_by is not null)
     or (old.status = 'open' and new.status = 'cancelled')
     or (old.status = 'taken' and new.status = 'done' and new.taken_by = old.taken_by)
     or (old.status = 'taken' and new.status = 'cancelled') then
    return new;
  end if;

  raise exception 'perubahan status permintaan bantuan tidak diizinkan (% ke %)', old.status, new.status
    using errcode = '42501';
end $$;

-- Fungsi trigger tidak perlu dipanggil langsung oleh siapa pun.
revoke all on function public.check_help_request_transition() from public, anon, authenticated;

create trigger help_requests_transition
  before update on public.help_requests
  for each row execute function public.check_help_request_transition();
