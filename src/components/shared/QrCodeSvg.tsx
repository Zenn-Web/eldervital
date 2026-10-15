import React, { useMemo } from "react";

interface QrCodeSvgProps {
  token?: string;
  size?: number;
  className?: string;
}

/**
 * Generator QR Code SVG mandiri tanpa dependensi eksternal berat.
 * Menghasilkan pola matriks QR realistis dengan finder patterns standar.
 */
export function QrCodeSvg({
  token = "EV-DEMO-TOKEN",
  size = 200,
  className = "",
}: QrCodeSvgProps) {
  const cells = useMemo(() => {
    const N = 25;
    // Hash sederhana dari token untuk seed
    let seed = 0;
    for (let i = 0; i < token.length; i++) {
      seed = (seed * 31 + token.charCodeAt(i)) % 233280;
    }
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const isFinder = (x: number, y: number): boolean | null => {
      if (x >= 0 && x < 7 && y >= 0 && y < 7) {
        return (
          x === 0 ||
          x === 6 ||
          y === 0 ||
          y === 6 ||
          (x >= 2 && x <= 4 && y >= 2 && y <= 4)
        );
      }
      return null;
    };

    const activeCells: [number, number][] = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let f = isFinder(x, y);
        if (f === null) f = isFinder(x - 18, y);
        if (f === null) f = isFinder(x, y - 18);

        const inFinderZone =
          (x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16);
        const on = f !== null ? f : !inFinderZone && rnd() > 0.45;
        if (on) activeCells.push([x, y]);
      }
    }
    return activeCells;
  }, [token]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 25 25"
      shapeRendering="crispEdges"
      className={`block select-none ${className}`.trim()}
      aria-label={`QR Code untuk token ${token}`}
      role="img"
    >
      {cells.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill="#1D2433"
        />
      ))}
    </svg>
  );
}
