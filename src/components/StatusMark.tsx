import type { ResultStatus } from "@/lib/screening";

/**
 * Tanda bentuk untuk status hasil. Warna tidak pernah menjadi satu-satunya penanda:
 * setiap status punya bentuk berbeda (lingkaran, segitiga, segi delapan, lingkaran putus-putus)
 * dan selalu ditemani kata di sebelahnya.
 */
export default function StatusMark({
  status,
  size = "md",
  className = "",
}: {
  status: ResultStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeMap = {
    sm: "w-6 h-6 shrink-0",
    md: "mark w-12 h-12 shrink-0",
    lg: "mark w-16 h-16 shrink-0",
  };
  const common = {
    className: `${sizeMap[size]} ${className}`.trim(),
    viewBox: "0 0 56 56",
    "aria-hidden": true,
    focusable: false,
  } as const;
  switch (status) {
    case "green":
      return (
        <svg {...common}>
          <circle cx="28" cy="28" r="25" fill="var(--ok-mark)" />
          <path d="M16 29l8 8 16-18" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="square" />
        </svg>
      );
    case "yellow":
      return (
        <svg {...common}>
          <path d="M28 4L53 49H3z" fill="var(--warn-mark)" />
          <path d="M28 20v15" stroke="#fff" strokeWidth="5" />
          <rect x="25.5" y="39" width="5" height="5" fill="#fff" />
        </svg>
      );
    case "red":
      return (
        <svg {...common}>
          <polygon points="18,3 38,3 53,18 53,38 38,53 18,53 3,38 3,18" fill="var(--alert-mark)" />
          <path d="M19 19l18 18M37 19L19 37" stroke="#fff" strokeWidth="5" />
        </svg>
      );
    case "insufficient":
      return (
        <svg {...common}>
          <circle cx="28" cy="28" r="24" fill="none" stroke="var(--none-ink)" strokeWidth="4" strokeDasharray="6 5" />
          <path
            d="M21 22c0-4 3-7 7-7s7 3 7 6.500c0 5-7 5-7 10"
            fill="none"
            stroke="var(--none-ink)"
            strokeWidth="4"
          />
          <rect x="25.500" y="38" width="5" height="5" fill="var(--none-ink)" />
        </svg>
      );
  }
}
