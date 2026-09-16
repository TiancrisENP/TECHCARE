import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#1C2024",      // superficie oscura del dashboard
        aluminum: "#EDEAE2",      // fondo tienda pública
        copper: "#B5652D",        // acento principal
        "copper-light": "#D68A4F",
        solder: "#3C6E4F",        // verde placa: completado / aprobado
        rust: "#C4432E",          // alerta / stock bajo / rechazo
        steel: "#7C8B93",         // texto secundario / bordes
        "steel-100": "#F1F2F3",
        ink: "#15181B",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        ticket: "2px",
      },
      backgroundImage: {
        perforation:
          "radial-gradient(circle, transparent 2px, currentColor 2.2px, currentColor 2.6px, transparent 2.8px)",
      },
    },
  },
  plugins: [],
};

export default config;
