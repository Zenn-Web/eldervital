import type { ElderProfile } from "../types";
import { Badge } from "@/components/ui/badge";

export default function CaregiverHeader({ elder }: { elder: ElderProfile }) {
  return (
    <header className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-serif font-bold text-xl border-2 border-primary/20"
            aria-hidden="true"
          >
            {elder.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight">
                {elder.name}
              </h1>
              <span className="text-sm text-ink-soft">({elder.age} tahun)</span>
            </div>
            <p className="text-xs sm:text-sm text-ink-soft">
              {elder.relation} &bull; Periksa terakhir:{" "}
              <strong className="text-ink font-semibold">{elder.lastCheckAt}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {elder.shareResults ? (
            <Badge variant="ok" className="text-xs py-1 px-2.5">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-ok-mark" />
              Berbagi Data Aktif
            </Badge>
          ) : (
            <Badge variant="warn" className="text-xs py-1 px-2.5">
              Berbagi Data Ditunda
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
