import type { HelpRequest } from "../types";
import { Button } from "@/components/ui/button";

interface HelpRequestAlertProps {
  request: HelpRequest;
  onOpenFollowUp: () => void;
  onResolve: () => void;
}

export default function HelpRequestAlert({
  request,
  onOpenFollowUp,
  onResolve,
}: HelpRequestAlertProps) {
  if (request.status === "resolved") {
    return null;
  }

  return (
    <section
      aria-labelledby="alert-bantuan-title"
      className="relative rounded-xl border-2 border-alert-mark bg-alert-bg/40 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-alert-mark text-white font-bold"
          aria-hidden="true"
        >
          !
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2
              id="alert-bantuan-title"
              className="text-base sm:text-lg font-bold text-alert-ink"
            >
              Permintaan Bantuan Lansia Aktif
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-alert-mark text-white">
              {request.relativeTime}
            </span>
          </div>
          <p className="mt-1 text-sm text-alert-ink">
            {request.elderName} menekan tombol &ldquo;Minta Bantuan&rdquo;. Segera
            pastikan keadaan lansia melalui kontak langsung atau kunjungan.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <a
              href={`tel:${request.phone}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-alert-mark px-4 py-2 text-sm font-bold text-white hover:bg-alert-mark/90 focus:outline-none focus:ring-2 focus:ring-alert-mark focus:ring-offset-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Telepon ({request.phone})
            </a>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenFollowUp}
              className="border-alert-ink/30 text-alert-ink bg-surface hover:bg-alert-bg"
            >
              Catat Tindak Lanjut
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResolve}
              className="text-ink-soft hover:text-ink text-xs ml-auto"
            >
              Tandai Telah Ditangani &times;
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
