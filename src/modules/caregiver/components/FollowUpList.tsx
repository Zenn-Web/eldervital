import type { FollowUpAction } from "../types";

export default function FollowUpList({ followUps }: { followUps: FollowUpAction[] }) {
  if (followUps.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4 text-center text-sm text-ink-soft">
        Belum ada catatan tindak lanjut yang disimpan.
      </div>
    );
  }

  return (
    <section
      aria-labelledby="followup-list-title"
      className="rounded-xl border border-line bg-surface p-4 sm:p-5 space-y-3"
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
            className="rounded-lg border border-line bg-paper/50 p-3 text-sm space-y-1"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-ink">{fu.typeLabel}</span>
              <span className="text-xs text-ink-soft">{fu.recordedAt}</span>
            </div>
            {fu.note && <p className="text-xs sm:text-sm text-ink-soft">{fu.note}</p>}
            <div className="text-[11px] text-ink-soft/80 pt-1">
              Dicatat oleh: <span className="font-semibold">{fu.caregiverName}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
