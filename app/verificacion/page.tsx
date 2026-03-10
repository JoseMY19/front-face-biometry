"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Sun, RefreshCcw, Fingerprint, Loader2, Camera, Upload } from "lucide-react";
import DecoratedBackground from "@/components/DecoratedBackground";
import logo from "@/src/assets/logo/logo.webp";
import { useState, useRef, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { comparePhoto } from "@/lib/api";

type CameraState = "loading" | "ready" | "error";
type Mode = "camera" | "upload";

export default function VerificationPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraState, setCameraState] = useState<CameraState>("loading");
  const [mode, setMode] = useState<Mode>("camera");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);

  // ── Camera logic ──
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState("loading");
    setErrorMsg("");
    stopCamera();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("notsupported");
      }

      // Most minimal constraint possible
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Let the browser handle play via autoPlay attribute
        setCameraState("ready");
      }
    } catch (err: unknown) {
      console.error("Camera error:", err);
      let msg = "No se pudo acceder a la cámara.";
      if (err instanceof Error && err.message === "notsupported") {
        msg = "Tu navegador no soporta acceso a la cámara.";
      } else if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
            msg = "Permiso de cámara denegado.";
            break;
          case "NotFoundError":
            msg = "No se encontró una cámara.";
            break;
          case "AbortError":
          case "NotReadableError":
            msg = "La cámara no respondió. Puede estar en uso por otra app.";
            break;
        }
      }
      setErrorMsg(msg);
      setCameraState("error");
    }
  }, [stopCamera]);

  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [mode, startCamera, stopCamera]);

  // ── Progress animation ──
  useEffect(() => {
    if (!processing) { setProgress(0); return; }
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 8 + 2));
    }, 300);
    return () => clearInterval(interval);
  }, [processing]);

  // ── Capture from camera ──
  const handleCameraCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) { toast.error("No se pudo capturar"); return; }

    await sendToBackend(blob);
  }, [processing, isMirrored]);

  // ── File upload ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadCapture = async () => {
    if (!selectedFile || processing) return;
    await sendToBackend(selectedFile);
  };

  const clearUpload = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Send to backend ──
  const sendToBackend = async (blob: Blob) => {
    setProcessing(true);
    const toastId = toast.loading("Verificando identidad...");

    try {
      const data = await comparePhoto(blob);
      setProgress(100);
      sessionStorage.setItem("verificationResult", JSON.stringify(data));
      toast.success("Verificación completada", { id: toastId });
      setTimeout(() => router.push("/resultado"), 400);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error en la verificación";
      toast.error(message, { id: toastId });
      setProcessing(false);
    }
  };

  // ── Main capture button handler ──
  const handleMainButton = () => {
    if (mode === "camera") handleCameraCapture();
    else handleUploadCapture();
  };

  const canCapture =
    (mode === "camera" && cameraState === "ready" && !processing) ||
    (mode === "upload" && selectedFile !== null && !processing);

  return (
    <main className="min-h-[100dvh] relative flex flex-col bg-white text-slate-800">
      <DecoratedBackground opacity={0.3} />
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link
            href="/login"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-24 sm:w-28 flex items-center justify-center">
            <Image src={logo} alt="Logo SJL" className="w-full h-auto object-contain" />
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10" />
        </div>

        {/* Titles */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-1.5 tracking-tight">
            Verificación Facial
          </h1>
          <p className="text-[#64748b] text-sm sm:text-base font-medium">
            Sistema de Identidad Biométrica
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setMode("camera"); clearUpload(); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mode === "camera" ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"
              }`}
            >
              <Camera className="w-4 h-4" />
              Cámara
            </button>
            <button
              onClick={() => setMode("upload")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mode === "upload" ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"
              }`}
            >
              <Upload className="w-4 h-4" />
              Subir foto
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#ebfcf1] rounded-full flex items-center justify-center mb-3">
            <User className="w-7 h-7 sm:w-8 sm:h-8 text-[#00a859]" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">
            {mode === "camera" ? "Centra tu rostro" : "Sube una foto de tu rostro"}
          </h2>
          <p className="text-[#64748b] text-xs sm:text-sm mt-1">
            {mode === "camera" ? "Mantén una expresión neutral" : "JPG, PNG o WEBP"}
          </p>
        </div>

        {/* Viewfinder Area */}
        <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] mx-auto mb-6 sm:mb-8">
          {/* Corner brackets */}
          <div className="absolute -top-1 -left-1 w-7 h-7 sm:w-8 sm:h-8 border-t-4 border-l-4 border-[#00a859] rounded-tl-xl z-20" />
          <div className="absolute -top-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 border-t-4 border-r-4 border-[#00a859] rounded-tr-xl z-20" />
          <div className="absolute -bottom-1 -left-1 w-7 h-7 sm:w-8 sm:h-8 border-b-4 border-l-4 border-[#00a859] rounded-bl-xl z-20" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 border-b-4 border-r-4 border-[#00a859] rounded-br-xl z-20" />

          <div className="absolute inset-2 bg-[#2a2d2f] rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">

            {/* ── CAMERA MODE ── */}
            {mode === "camera" && (
              <>
                {cameraState === "error" ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400 px-4 text-center">
                    <Camera className="w-10 h-10 text-slate-500" />
                    <p className="text-xs leading-tight">{errorMsg}</p>
                    <button onClick={startCamera} className="mt-1 text-[#00a859] text-xs font-bold underline">
                      Reintentar
                    </button>
                    <button
                      onClick={() => setMode("upload")}
                      className="text-[#00a859] text-xs font-bold underline"
                    >
                      O sube una foto
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
                    />
                    {cameraState === "loading" && (
                      <div className="absolute inset-0 bg-[#2a2d2f] flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-[#00a859] animate-spin" />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── UPLOAD MODE ── */}
            {mode === "upload" && (
              <>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-3 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    <Upload className="w-12 h-12" />
                    <span className="text-xs font-medium">Toca para seleccionar</span>
                  </button>
                )}
              </>
            )}

            {/* Scan overlay when processing */}
            {processing && (
              <>
                <div className="absolute inset-4 border-2 border-[#00a859]/30 rounded-full z-10" />
                <div className="absolute inset-8 border border-[#00a859]/20 border-dashed rounded-full z-10" />
                <div className="absolute inset-12 border border-[#00a859]/10 rounded-full z-10" />
                <div
                  className="absolute left-0 right-0 h-0.5 bg-[#00a859] shadow-[0_0_15px_rgba(0,168,89,1)] opacity-80 z-10"
                  style={{ top: `${progress}%`, transition: "top 0.3s linear" }}
                />
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {processing && (
          <div className="mb-8 sm:mb-10 w-full max-w-[280px] sm:max-w-[320px] mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00a859] animate-pulse" />
                <span className="text-xs sm:text-sm font-bold text-[#0f172a]">Verificando...</span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#00a859]">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 sm:h-2.5 overflow-hidden">
              <div
                className="bg-[#00a859] h-2 sm:h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Hint */}
        {!processing && (
          <div className="mb-6 sm:mb-8 w-full max-w-[280px] sm:max-w-[320px] mx-auto text-center">
            {mode === "camera" && cameraState === "ready" && (
              <p className="text-xs sm:text-sm text-[#64748b]">Presiona el botón verde para verificar</p>
            )}
            {mode === "upload" && previewUrl && (
              <button onClick={clearUpload} className="text-xs text-[#ef4444] font-semibold underline">
                Cambiar foto
              </button>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex justify-center items-center gap-5 sm:gap-6 mt-auto pb-4">
          <button
            onClick={() => {
              if (mode === "upload") fileInputRef.current?.click();
            }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#f8fafc] border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all shadow-sm active:scale-95"
          >
            {mode === "camera" ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Upload className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <button
            onClick={handleMainButton}
            disabled={!canCapture}
            className="rounded-full bg-[#00a859] flex items-center justify-center text-white hover:bg-[#00924d] active:scale-95 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ width: "4.5rem", height: "4.5rem" }}
          >
            {processing ? (
              <Loader2 className="w-9 h-9 animate-spin" />
            ) : (
              <Fingerprint className="w-9 h-9 sm:w-10 sm:h-10" />
            )}
          </button>

          <button
            onClick={() => {
              if (mode === "camera") setIsMirrored((p) => !p);
              else clearUpload();
            }}
            disabled={processing}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#f8fafc] border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center py-4 sm:py-6 text-[10px] sm:text-xs text-slate-500 font-medium relative z-10 px-4">
        © 2025 SJL Todos los derechos reservados.
      </div>
    </main>
  );
}
