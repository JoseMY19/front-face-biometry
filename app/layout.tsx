import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Biometría Facial",
  description: "Sistema de verificación biométrica facial",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-[100dvh] antialiased overscroll-none">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", fontSize: "14px" },
          }}
        />
      </body>
    </html>
  );
}
