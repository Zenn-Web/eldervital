import type { FollowUpAction } from "../types";
import { CalendarIcon } from "@/components/shared/Icons";
import { formatReadableDateID } from "@/components/ui/date-picker";

export default function FollowUpList({ followUps }: { followUps: FollowUpAction[] }) {
  if (followUps.length === 0) {
    return (
      <div className="rounded-2xl border border-line/60 bg-surface p-4 text-center text-sm text-ink-soft">
        Belum ada catatan tindak lanjut yang disimpan.
      </div>
    );
  }

  return (
    <section
      aria-labelledby="followup-list-title"
      className="rounded-2xl border border-line/60 bg-surface p-4 sm:p-5 space-y-3 shadow-none"
    >
      <div className="flex items-center justify-between">
        <h2 id="followup-list-title" className="text-base font-bold text-ink">
          Catatan Tindak Lanjut Terakhir
        </h2>
        <span className="text-xs text-ink-soft">
          {followUps.length} catatan
        </span>
      </div>

      <div className="space-y-2.5">
        {followUps.map((fu) => (
          <div
            key={fu.id}
            className="rounded-xl border border-line/60 bg-paper/50 p-3 text-sm space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-ink">{fu.typeLabel}</span>
              <span className="text-xs text-ink-soft">{fu.recordedAt}</span>
            </div>

            {(fu.scheduledDate || fu.scheduledTime) && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                <CalendarIcon size={13} />
                <span>
                  Jadwal: {fu.scheduledDate ? formatReadableDateID(fu.scheduledDate) : "Hari ini"}{" "}
                  {fu.scheduledTime ? `pukul ${fu.scheduledTime} WIB` : ""}
                </span>
              </div>
            )}

            {fu.note && <p className="text-xs sm:text-sm text-ink-soft">{fu.note}</p>}
            <div className="text-[11px] text-ink-soft/80 pt-0.5">
              Dicatat oleh: <span className="font-semibold">{fu.caregiverName}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
