import type { Session } from "@supabase/supabase-js";
import type { Role } from "@/lib/supabase/client";

export type AuthState =
  | { status: "unconfigured" } // env Supabase kosong: aplikasi berjalan sebagai simulasi
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; session: Session };

  /**
 * Status sesi Supabase untuk satu peran.
 * STUB: selalu "unconfigured" sehingga UI berjalan dalam mode simulasi.
 */
export function useAuthSession(role: Role): AuthState {
  void role;
  return { status: "unconfigured" };
}
