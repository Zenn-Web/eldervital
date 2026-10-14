import type { HelpRequest } from "../types";
import { Button } from "@/components/ui/button";
import { PhoneIcon, AlertTriangleIcon, CloseIcon } from "@/components/shared/Icons";

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
      className="relative rounded-2xl border-2 border-alert-mark bg-alert-bg/40 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3.5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-alert-mark text-white shadow-sm"
          aria-hidden="true"
        >
          <AlertTriangleIcon size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2
              id="alert-bantuan-title"
              className="text-base sm:text-lg font-bold text-alert-ink"
            >
              Permintaan Bantuan Lansia Aktif
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-alert-mark text-white">
              {request.relativeTime}
            </span>
          </div>
          <p className="mt-1 text-sm text-alert-ink leading-relaxed">
            {request.elderName} menekan tombol &ldquo;Minta Bantuan&rdquo;. Segera
            pastikan keadaan lansia melalui kontak telepon langsung atau kunjungan.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <a
              href={`tel:${request.phone}`}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-alert-mark px-4 py-2 text-sm font-bold text-white hover:bg-alert-mark/90 focus:outline-none focus:ring-4 focus:ring-focus transition-colors shadow-none"
            >
              <PhoneIcon size={18} />
              <span>Telepon ({request.phone})</span>
            </a>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenFollowUp}
              className="border-alert-ink/30 text-alert-ink bg-surface hover:bg-alert-bg font-bold"
            >
              Catat Tindak Lanjut
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResolve}
              className="text-ink-soft hover:text-ink text-xs ml-auto gap-1"
            >
              <span>Selesai</span>
              <CloseIcon size={14} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
