"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Check, X, RefreshCw, User, Shield, Clock } from "lucide-react";
import DecoratedBackground from "@/components/DecoratedBackground";
import logo from "@/src/assets/logo/logo.webp";
import { photoUrl, getEmpleadosByPhoto, getEmpleadoByDni } from "@/lib/api";
import type { CompareResponse } from "@/types";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [empleado, setEmpleados] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("verificationResult");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResult(parsed);
        // Buscar datos por DNI en Gestionate (más confiable que por nombre de archivo)
        if (parsed.best_match?.dni) {
          console.log("🔍 Buscando por DNI:", parsed.best_match.dni);
          fetch(`${process.env.NEXT_PUBLIC_GESTIONATE_URL || 'http://172.16.10.10:3000'}/api/empleado/dni/${parsed.best_match.dni}`)
            .then(r => r.json())
            .then((emp: any) => {
              console.log("📦 Datos de Gestionate:", emp);
              // Extrae data si viene envuelto {message, data, statusCode}
              const data = emp?.data ?? emp;
              if (data?.nombres) {
                setEmpleados({
                  person_id: parsed.best_match.person_id,
                  photo_url: parsed.best_match.photo_url,
                  nombres: data.nombres,
                  apellidos: data.apellidos,
                  dni: data.dni,
                  similarity_percentage: parsed.best_match.similarity_percentage
                });
              } else {
                // Fallback a datos de Biometry
                setEmpleados({
                  person_id: parsed.best_match.person_id,
                  photo_url: parsed.best_match.photo_url,
                  name: parsed.best_match.name || "Sin nombre",
                  dni: parsed.best_match.dni,
                  similarity_percentage: parsed.best_match.similarity_percentage
                });
              }
            })
            .catch(() => {
              // Si falla, mostrar datos de Biometry
              setEmpleados({
                person_id: parsed.best_match.person_id,
                photo_url: parsed.best_match.photo_url,
                name: parsed.best_match.name || "Sin nombre",
                dni: parsed.best_match.dni,
                similarity_percentage: parsed.best_match.similarity_percentage
              });
            });
        }
      } catch {
        // Invalid data
      }
    }
    setLoading(false);
  }, []);

  const hasMatch = result?.best_match !== null && result?.best_match !== undefined;
  const bestMatch = result?.best_match;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

  const handleRetry = () => {
    sessionStorage.removeItem("verificationResult");
    router.push("/verificacion");
  };

  if (loading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#00a859] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-[100dvh] relative flex flex-col items-center justify-center bg-white text-slate-800 py-10">
        <DecoratedBackground opacity={0.6} />
        <div className="relative z-10 text-center px-6">
          <p className="text-slate-500 mb-4">No hay datos de verificación</p>
          <Link
            href="/verificacion"
            className="inline-block bg-[#00a859] hover:bg-[#00924d] text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-[0.98]"
          >
            Ir a verificación
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] relative flex flex-col items-center bg-white text-slate-800 py-8 sm:py-10">
      <DecoratedBackground opacity={0.6} />

      {/* Header */}
      <div className="relative z-10 w-full max-w-sm px-4 sm:px-6 flex flex-col items-center mb-6 sm:mb-8">
        <div className="w-40 sm:w-48 mb-2">
          <Image
            src={logo}
            alt="San Juan de Lurigancho"
            className="w-full h-auto"
            priority
          />
        </div>
        <div className="font-bold text-[#0f172a] tracking-tight text-sm">SJL</div>
      </div>

      <h1 className="relative z-10 text-xl sm:text-2xl font-bold text-[#0f172a] mb-8 sm:mb-12">
        Verificación
      </h1>

      <div className="relative z-10 w-full max-w-sm px-4 sm:px-6 flex flex-col items-center flex-1">

        {/* Success View */}
        {hasMatch && bestMatch && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#00a859] rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-green-500/30">
              <Check className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[3]" />
            </div>
            <div className="text-[#00a859] text-[10px] sm:text-xs font-bold tracking-widest mb-1">
              ÉXITO
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0f172a] mb-1.5 sm:mb-2">
              Identidad verificada
            </h2>
            <p className="text-[#64748b] text-xs sm:text-sm mb-6 sm:mb-8">
              Coincidencia: {bestMatch.similarity_percentage?.toFixed(1) ?? bestMatch.similarity_percentage}%
            </p>

            {/* User Card */}
            <div className="w-full bg-[#f8fafc] rounded-2xl p-5 sm:p-6 flex flex-col items-center shadow-sm border border-slate-100">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1e293b] rounded-full flex items-center justify-center overflow-hidden mb-3 sm:mb-4 border-2 border-slate-200">
                {bestMatch.photo_url ? (
                  <img
                    src={photoUrl(bestMatch.photo_url)}
                    alt={bestMatch.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
                )}
              </div>

              <h3 className="font-bold text-[#0f172a] text-base sm:text-lg">
                {bestMatch.name}
              </h3>

              <div className="w-full mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-[10px] sm:text-xs font-medium text-[#64748b] uppercase tracking-wide">Nombre</span>
                  <span className="text-xs sm:text-sm font-semibold text-[#0f172a]">{empleado?.nombres ?? empleado?.name ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-[10px] sm:text-xs font-medium text-[#64748b] uppercase tracking-wide">Apellido</span>
                  <span className="text-xs sm:text-sm font-semibold text-[#94a3b8] italic">{empleado?.apellidos ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-[10px] sm:text-xs font-medium text-[#64748b] uppercase tracking-wide">DNI</span>
                  <span className="text-xs sm:text-sm font-semibold text-[#94a3b8] italic">{empleado?.dni ?? "-"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs text-[#64748b]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{timeStr}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{dateStr}</span>
                </div>
              </div>
            </div>

            <div className="w-full mt-6 sm:mt-8 space-y-2.5 sm:space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-[#00a859] hover:bg-[#00924d] active:bg-[#007b41] text-white font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 active:scale-[0.98] text-sm sm:text-base"
              >
                Nueva verificación
              </button>
              <Link
                href="/login"
                className="w-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-600 active:bg-[#cbd5e1] font-bold py-3 sm:py-3.5 rounded-xl transition-all flex items-center justify-center active:scale-[0.98] text-sm sm:text-base"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        )}

        {/* Error View */}
        {!hasMatch && (
          <div className="w-full flex flex-col items-center animate-fade-in">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#ef4444] rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-red-500/30">
              <X className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[3]" />
            </div>
            <div className="text-[#ef4444] text-[10px] sm:text-xs font-bold tracking-widest mb-1">
              SIN COINCIDENCIA
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0f172a] mb-1.5 sm:mb-2">
              No identificado
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm text-center mb-5 sm:mb-6">
              No se encontró coincidencia en la base de datos.
              Asegúrate de estar en un lugar iluminado.
            </p>

            {result.query_photo_url ? (
              <div className="w-full aspect-[16/9] bg-slate-200 rounded-xl overflow-hidden mb-6 sm:mb-8 relative border border-slate-200 shadow-sm">
                <img
                  src={photoUrl(result.query_photo_url)}
                  alt="Foto capturada"
                  className="w-full h-full object-cover blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent mix-blend-overlay" />
              </div>
            ) : (
              <div className="w-full aspect-[16/9] bg-slate-200 rounded-xl overflow-hidden mb-6 sm:mb-8 relative border border-slate-200 shadow-sm">
                <div className="absolute inset-0 bg-slate-300 flex items-center justify-center blur-sm">
                  <User className="w-20 h-20 sm:w-24 sm:h-24 text-slate-400 opacity-50" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent mix-blend-overlay" />
              </div>
            )}

            <div className="w-full space-y-2.5 sm:space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-[#00a859] hover:bg-[#00924d] active:bg-[#007b41] text-white font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 active:scale-[0.98] text-sm sm:text-base"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                Reintentar Verificación
              </button>

              <Link
                href="/login"
                className="w-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-600 active:bg-[#cbd5e1] font-bold py-3 sm:py-3.5 rounded-xl transition-all flex items-center justify-center active:scale-[0.98] text-sm sm:text-base"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
