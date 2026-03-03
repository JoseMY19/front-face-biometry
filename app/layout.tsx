import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Biometría Facial",
  description: "Reconocimiento facial con ArcFace, detección de lentes y análisis LLM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#0a0a0f] text-slate-200 antialiased">
        <Navigation />
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1e1e2e", color: "#e2e8f0", border: "1px solid #334155" },
          }}
        />
      </body>
    </html>
  );
}
