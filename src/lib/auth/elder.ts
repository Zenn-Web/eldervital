import { notImplemented } from "../not-implemented";

//check age_range do supabase sql migration
export type AgeRange = "50-54"|"55-59"|"60-65"|"lebih-65";

export const AGE_RANGES: readonly { value: AgeRange; label: string }[] = [
  { value: "50-54", label: "50 sampai 54 tahun" },
  { value: "55-59", label: "55 sampai 59 tahun" },
  { value: "60-65", label: "60 sampai 65 tahun" },
  { value: "lebih-65", label: "Lebih dari 65 tahun" },
];

export interface ElderProfile {
     /** elders.id: dikirim sebagai elder_id saat menyimpan pemeriksaan. */
    id: string;
    /** auth.uid() sesi anonim di perangkat ini: pengikat antrean penyimpanan. */
    deviceUserId: string;
    displayNmae: string;
}

/** Masuk anonim bila belum ada sesi, lalu create_elder_profile (idempoten). */
export async function createElderProfile(
  name: string,
  ageRange: AgeRange | null,
): Promise<ElderProfile> {
  void [name, ageRange];
  throw notImplemented("createElderProfile");
}

/** null bila sesi ada tetapi profil belum dibuat (UI menampilkan formulir). */
export async function loadElderProfile (deviceUserId: string): Promise<ElderProfile | null> {
    void deviceUserId;
    throw notImplemented("loadElderProfile");
} 


