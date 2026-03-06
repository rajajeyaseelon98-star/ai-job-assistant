import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          light: "#818CF8",
        },
        background: "#F9FAFB",
        card: "#FFFFFF",
        text: {
          DEFAULT: "#111827",
          muted: "#6B7280",
        },
      },
    },
  },
  plugins: [],
};

export default config;
