import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#0B1220",
        aluminum: "#EEF2F7",
        copper: "#0284C7",
        "copper-light": "#38BDF8",
        solder: "#059669",
        rust: "#E11D48",
        steel: "#64748B",
        "steel-100": "#F1F5F9",
        ink: "#0F172A",
        manila: "#E2E8F0",
        cream: "#FFFFFF",
      },
      fontFamily: {
        display: ["var(--font-display)", "Segoe UI", "sans-serif"],
        body: ["var(--font-body)", "Segoe UI", "sans-serif"],
        note: ["var(--font-mono)", "ui-monospace", "monospace"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        ticket: "8px",
      },
      boxShadow: {
        paper: "0 1px 0 rgba(15, 23, 42, 0.06), 0 12px 28px -18px rgba(11, 18, 32, 0.35)",
        lamp: "0 20px 40px -24px rgba(2, 132, 199, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
