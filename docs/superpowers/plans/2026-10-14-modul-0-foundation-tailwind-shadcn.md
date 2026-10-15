# Modul 0: Setup Tailwind CSS, shadcn/ui & Desain Sistem Ramah Lansia (J2CTS-24) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun fondasi styling frontend ElderVital dengan mengintegrasikan Tailwind CSS, utilitas shadcn/ui, font aksesibilitas (Atkinson Hyperlegible & Bitter), serta token desain *Warm Paper & Batik Indigo* dari `ElderVital P0` ke dalam komponen UI dasar yang siap pakai untuk modul-modul berikutnya.

**Architecture:** Tailwind CSS dikonfigurasikan dengan CSS variables semantik di `src/app/globals.css`. Utilitas `cn` (`clsx` + `tailwind-merge`) dipasang di `src/lib/utils.ts`. Komponen dasar shadcn/ui (`Button`, `Card`, `Badge`, `Dialog`) dibangun di `src/components/ui/` dengan kepatuhan aksesibilitas lansia (target sentuh minimal 48px/60px, kontras tinggi WCAG AAA >= 7:1, status bentuk+warna di `StatusMark`).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, PostCSS, clsx, tailwind-merge, Atkinson Hyperlegible Next, Bitter (Google Fonts), Vitest.

## Global Constraints

- Semua warna, jarak, dan radius harus menggunakan token semantik terpusat (tidak boleh ada hex hardcoded acak di komponen).
- Tombol aksi untuk lansia wajib memiliki tinggi minimal `3.75rem` (60px) dan area sentuh tidak kurang dari 48px untuk mode umum.
- Status hasil tidak boleh hanya mengandalkan warna; wajib memadukan warna dengan bentuk geometris (`StatusMark`: lingkaran = hijau, belah ketupat = kuning, segi delapan = merah, kotak = netral).
- Kontras teks dengan latar belakang wajib memenuhi standar minimal WCAG AAA (7:1 untuk teks normal).
- Seluruh 81 tes vitest yang sudah ada wajib tetap hijau (passing).

---

### Task 1: Instalasi & Konfigurasi Tailwind CSS serta PostCSS

**Files:**
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Modify: `package.json`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: Next.js 16 build pipeline
- Produces: Kompatibilitas utilitas Tailwind di seluruh file `.tsx`

- [ ] **Step 1: Install dependensi Tailwind CSS, PostCSS, Autoprefixer, clsx, dan tailwind-merge**

Run:
```bash
npm.cmd install -D tailwindcss@^3.4.17 postcss autoprefixer
npm.cmd install clsx tailwind-merge
```

- [ ] **Step 2: Buat `postcss.config.mjs`**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

- [ ] **Step 3: Buat `tailwind.config.ts` dengan token warna ElderVital P0**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
        },
        line: "var(--line)",
        primary: {
          DEFAULT: "var(--primary)",
          strong: "var(--primary-strong)",
          foreground: "var(--on-primary)",
        },
        sogan: {
          DEFAULT: "var(--sogan)",
          strong: "var(--sogan-strong)",
          foreground: "#ffffff",
        },
        focus: "var(--focus)",
        status: {
          ok: {
            bg: "var(--ok-bg)",
            ink: "var(--ok-ink)",
            mark: "var(--ok-mark)",
          },
          warn: {
            bg: "var(--warn-bg)",
            ink: "var(--warn-ink)",
            mark: "var(--warn-mark)",
          },
          alert: {
            bg: "var(--alert-bg)",
            ink: "var(--alert-ink)",
            mark: "var(--alert-mark)",
          },
          none: {
            bg: "var(--none-bg)",
            ink: "var(--none-ink)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      spacing: {
        s1: "var(--s1)",
        s2: "var(--s2)",
        s3: "var(--s3)",
        s4: "var(--s4)",
        s5: "var(--s5)",
        s6: "var(--s6)",
        s7: "var(--s7)",
        tap: "var(--tap)",
        "tap-lg": "var(--tap-lg)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "calc(var(--radius) + 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Update `src/app/globals.css` dengan arahan Tailwind dan token P0**

Tambahkan `@tailwind base; @tailwind components; @tailwind utilities;` di bagian atas `src/app/globals.css` tanpa menghapus gaya bawaan yang sudah ada.

- [ ] **Step 5: Verifikasi build dan testing**

Run: `npm.cmd test`
Expected: 81 tests pass.

---

### Task 2: Setup Font Bitter & Atkinson di Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `@fontsource-variable/atkinson-hyperlegible-next` & `next/font/google` (Bitter)
- Produces: CSS class `--font-sans` dan `--font-serif` pada tag `<html>`

- [ ] **Step 1: Konfigurasi Bitter dan Atkinson di `src/app/layout.tsx`**

```tsx
import { Bitter } from "next/font/google";
import "@fontsource-variable/atkinson-hyperlegible-next";

const bitter = Bitter({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["600", "700"],
});
```

Inject `bitter.variable` ke className `<html>`.

- [ ] **Step 2: Verifikasi typecheck dan render font**

Run: `npm.cmd run typecheck`
Expected: Pass tanpa error.

---

### Task 3: Setup Utility Helper `src/lib/utils.ts`

**Files:**
- Create: `src/lib/utils.ts`
- Test: `src/lib/utils.test.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string`

- [ ] **Step 1: Tulis tes unit untuk helper `cn`**

Buat `src/lib/utils.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
    expect(cn("px-4", false && "py-2", "px-6")).toBe("py-2 px-6"); // tailwind-merge resolves conflicts
  });
});
```

- [ ] **Step 2: Implementasi `src/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Jalankan tes unit `cn`**

Run: `npm.cmd test src/lib/utils.test.ts`
Expected: PASS (1 test).

---

### Task 4: Implementasi Komponen Dasar shadcn/ui Ramah Lansia (`Button`, `Card`, `Badge`)

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Test: `src/components/ui/button.test.tsx`

**Interfaces:**
- Produces:
  - `<Button variant="primary" | "secondary" | "choice" | "outline" | "ghost" size="default" | "senior" />`
  - `<Card />`, `<CardHeader />`, `<CardTitle />`, `<CardContent />`
  - `<Badge variant="ok" | "warn" | "alert" | "neutral" />`

- [ ] **Step 1: Tulis tes unit untuk `Button` ramah lansia**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button component", () => {
  it("renders with senior touch target by default for senior size", () => {
    // Memastikan kelas min-h-[3.75rem] terpasang untuk size senior
  });
});
```

- [ ] **Step 2: Implementasi `src/components/ui/button.tsx`**
- [ ] **Step 3: Implementasi `src/components/ui/card.tsx`**
- [ ] **Step 4: Implementasi `src/components/ui/badge.tsx`**
- [ ] **Step 5: Verifikasi seluruh pengujian**

Run: `npm.cmd test`
Expected: Semua unit tests PASS.

---

### Task 5: Refactoring & Harmonisasi Komponen Bersama (`StatusMark` & `SimBanner`)

**Files:**
- Modify: `src/components/StatusMark.tsx`
- Modify: `src/components/SimBanner.tsx`

**Interfaces:**
- Produces:
  - `<StatusMark status="green" | "yellow" | "red" | "insufficient" size="sm" | "md" | "lg" />`
  - `<SimBanner />`

- [ ] **Step 1: Update `StatusMark.tsx` agar mendukung ukuran fleksibel & styling Tailwind semantik**
- [ ] **Step 2: Update `SimBanner.tsx` agar konsisten dengan warna peringatan P0**
- [ ] **Step 3: Jalankan `npm.cmd run check` untuk memverifikasi lint, typecheck, dan seluruh 80+ tes**

---

### Task 6: Commit dan Update Status Jira J2CTS-24

- [ ] **Step 1: Git commit kecil dan rapi**

```bash
git add .
git commit -m "feat(modul-0): setup tailwind css, shadcn utils, and elder design tokens (J2CTS-24)"
```

- [ ] **Step 2: Update status Jira J2CTS-24 ke 'In Progress' atau 'Done' via Jira API**
