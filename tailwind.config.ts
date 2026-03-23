import type { Config } from "tailwindcss";

/**
 * Premium SaaS theme: Navy (#0F172A) + White + Blue accent (#2563EB).
 * @see components/ui/Button.tsx, Card.tsx, Input.tsx
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
        /** Navy — primary text / headings */
        foreground: "#0F172A",
        /** Secondary body copy */
        muted: "#64748B",
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          foreground: "#FFFFFF",
        },
        text: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
        },
        /** Kanban columns & subtle panels */
        surface: {
          muted: "#F1F5F9",
          column: "#F1F5F9",
        },
        gray: {
          200: "#E2E8F0",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
        "card-md":
          "0 4px 6px -1px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)",
        nav: "0 1px 0 0 rgb(226 232 240 / 1)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      transitionDuration: {
        DEFAULT: "200ms",
        150: "150ms",
        200: "200ms",
        250: "250ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        smooth: "ease-in-out",
      },
      spacing: {
        /** 8px grid helpers */
        4.5: "1.125rem",
        18: "4.5rem",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        /** Geometric display — auth & marketing headings */
        display: [
          "var(--font-display)",
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      screens: {
        xs: "480px",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
