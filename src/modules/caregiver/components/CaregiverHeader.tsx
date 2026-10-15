import type { ElderProfile } from "../types";
import { Badge } from "@/components/ui/badge";

export default function CaregiverHeader({ elder }: { elder: ElderProfile }) {
  // Abaikan sapaan umum seperti Ibu/Bapak/Pak/Bu agar inisial nama utama akurat (cth: "Ibu Sari Rahayu" -> "SR")
  const cleanName = elder.name.replace(/^(Ibu|Bapak|Pak|Bu)\s+/i, "");
  const parts = cleanName.trim().split(/\s+/);
  const initials = (
    parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.slice(0, 2) || "NN"
  ).toUpperCase();

  return (
    <header className="rounded-2xl border border-line/60 bg-surface p-4 sm:p-5 shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar circle */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-white font-serif font-bold text-xl shadow-xs ring-4 ring-primary/10"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
                {elder.name}
              </h1>
              <span className="text-sm text-ink-soft">{elder.age} thn</span>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
              {elder.relation} &bull; Periksa terakhir:{" "}
              <strong className="text-ink font-semibold">{elder.lastCheckAt}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {elder.shareResults ? (
            <Badge variant="ok" className="text-xs py-1 px-2.5 rounded-full">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-ok-mark" />
              Berbagi Data Aktif
            </Badge>
          ) : (
            <Badge variant="warn" className="text-xs py-1 px-2.5 rounded-full">
              Berbagi Data Ditunda
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
