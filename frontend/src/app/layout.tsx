import type { Metadata } from "next";
import { Archivo, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

const body = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TECHCARE — Venta y servicio técnico de computadores",
  description:
    "Compra equipos y componentes, sigue tu reparación y gestiona tus garantías en un solo lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-aluminum text-ink`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
