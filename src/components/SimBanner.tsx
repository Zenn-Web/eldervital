/** Penanda wajib untuk bagian yang masih simulasi (spesifikasi: data simulasi diberi label jelas). */
export default function SimBanner({ children }: { children: React.ReactNode }) {
  return (
    <header role="note" aria-label="Penanda data simulasi prototipe">
      <div className="bg-ink text-paper py-2 px-4 text-xs sm:text-sm font-semibold text-center flex items-center justify-center gap-2 border-b border-line/40">
        <span
          className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-sogan text-white text-[10px] font-bold shrink-0 select-none"
          aria-hidden="true"
        >
          i
        </span>
        <span>{children}</span>
      </div>
    </header>
  );
}
