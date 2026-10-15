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
        ok: {
          DEFAULT: "var(--ok-mark)",
          bg: "var(--ok-bg)",
          ink: "var(--ok-ink)",
          mark: "var(--ok-mark)",
        },
        warn: {
          DEFAULT: "var(--warn-mark)",
          bg: "var(--warn-bg)",
          ink: "var(--warn-ink)",
          mark: "var(--warn-mark)",
        },
        alert: {
          DEFAULT: "var(--alert-mark)",
          bg: "var(--alert-bg)",
          ink: "var(--alert-ink)",
          mark: "var(--alert-mark)",
        },
        none: {
          DEFAULT: "var(--none-ink)",
          bg: "var(--none-bg)",
          ink: "var(--none-ink)",
        },
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
        "tap-standard": "var(--tap-standard, 3rem)",
        "tap-lg": "var(--tap-lg, 4.25rem)",
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
