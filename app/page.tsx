"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, ScanFace, AlertCircle } from "lucide-react";
import CameraCapture from "@/components/CameraCapture";
import ComparisonResults from "@/components/ComparisonResults";
import { comparePhoto } from "@/lib/api";
import type { CompareResponse } from "@/types";

export default function ComparePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (blob: Blob) => {
    setLoading(true);
    setResult(null);
    setError(null);

    const toastId = toast.loading("Analizando biometría facial...");

    try {
      const data = await comparePhoto(blob);
      setResult(data);
      toast.success("Análisis completado", { id: toastId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
          <ScanFace className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          Comparación biométrica
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Captura o sube una foto para identificarla contra la base de datos facial.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        {/* Left: capture */}
        <div className="space-y-3 sm:space-y-4">
          <CameraCapture onCapture={handleCapture} disabled={loading} />

          {/* How-to — colapsado en mobile */}
          <details className="card p-3 sm:p-4 text-sm text-slate-400 group">
            <summary className="text-slate-300 font-medium cursor-pointer list-none flex items-center justify-between select-none">
              ¿Cómo funciona?
              <span className="text-slate-500 text-xs group-open:hidden">▸ ver</span>
              <span className="text-slate-500 text-xs hidden group-open:inline">▾ ocultar</span>
            </summary>
            <div className="mt-2 space-y-1">
              <p>1. Captura una foto o sube una imagen</p>
              <p>2. Ensemble <strong className="text-blue-400">ArcFace + FaceNet512 + SFace</strong> extrae embeddings</p>
              <p>3. Se compara contra todas las personas en la BD</p>
              <p>4. <strong className="text-amber-400">YOLOv8</strong> detecta lentes y objetos</p>
              <p>5. <strong className="text-purple-400">Gemini IA</strong> genera el informe final</p>
            </div>
          </details>
        </div>

        {/* Right: results */}
        <div className="space-y-3 sm:space-y-4">
          {loading && (
            <div className="card p-10 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
              <p className="font-medium">Procesando imagen...</p>
              <p className="text-xs text-slate-500 text-center">
                ArcFace extrayendo embeddings · YOLOv8 detectando objetos · Gemini generando informe
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="card p-5 border-red-800/50 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-400">Error en el análisis</p>
                <p className="text-sm text-slate-400 mt-1">{error}</p>
              </div>
            </div>
          )}

          {result && !loading && <ComparisonResults data={result} />}

          {!result && !loading && !error && (
            <div className="card p-10 flex flex-col items-center gap-3 text-slate-600">
              <ScanFace className="w-12 h-12" />
              <p className="text-center text-sm">
                Los resultados aparecerán aquí después de capturar una foto
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
