/** Penanda wajib untuk bagian yang masih simulasi (spesifikasi: data simulasi diberi label jelas). */
export default function SimBanner({ children }: { children: React.ReactNode }) {
  return (
    <header>
      <p className="sim">{children}</p>
    </header>
  );
}
