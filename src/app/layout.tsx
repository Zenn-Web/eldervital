import type { Metadata, Viewport } from "next";
import { Bitter } from "next/font/google";
import localFont from "next/font/local";
import RegisterSW from "@/components/RegisterSW";
import DemoPanel from "@/components/DemoPanel";
import "./globals.css";

// Atkinson Hyperlegible Next (SIL OFL), disajikan dari server sendiri agar tetap
// tampil saat offline dan tanpa permintaan ke pihak luar. Lisensi: ./fonts/OFL-LICENSE.txt
const sans = localFont({
  src: [
    {
      path: "./fonts/atkinson-hyperlegible-next-latin-wght-normal.woff2",
      style: "normal",
      weight: "200 800",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const serif = Bitter({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: { default: "ElderVital", template: "%s | ElderVital" },
  description:
    "Pemeriksaan gejala harian untuk usia 50 sampai 65 tahun, mandiri atau ditemani caregiver. Hasil skrining, bukan diagnosis.",
  applicationName: "ElderVital",
  appleWebApp: { capable: true, title: "ElderVital", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0e5a4c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <a className="skip" href="#isi">
          Lewati ke isi utama
        </a>
        {children}
        <RegisterSW />
        <DemoPanel />
      </body>
    </html>
  );
}
