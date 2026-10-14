import type {User} from "@supabase/supabase-js";
import { notImplemented } from "../not-implemented";

export interface CaregiverProfile {
    id: string;
    displayname: string;
}

/** needsConfirmation: true bila Supabase meminta konfirmasi email sebelum ada sesi. */
export async function signUpCaregiver(
    name: string,
    email: string,
    password: string,
): Promise<{ needsConfirmation: boolean }> {
    void [name, email, password];
    throw notImplemented("signUpCaregiver");
}

export async function signInCaregiver (email: string, password: string): Promise<void> {
    void[email, password];
    throw notImplemented("signUpCaregiver");
}

/** Hanya perangkat ini yang keluar. */
export async function signOutCaregiver(): Promise<void> {
  throw notImplemented("signOutCaregiver");
}

/** Membuat baris caregivers bila belum ada. Aman dipanggil berulang. */
export async function ensureCaregiverProfile(user: User): Promise<CaregiverProfile> {
  void user;
  throw notImplemented("ensureCaregiverProfile");
}