"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Sun, SwitchCamera, Fingerprint, Loader2, Camera, X } from "lucide-react";
import DecoratedBackground from "@/components/DecoratedBackground";
import logo from "@/src/assets/logo/logo.webp";
import { useState, useRef, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { comparePhoto } from "@/lib/api";

type Step = "live" | "preview" | "processing";

export default function VerificationPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>("live");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  // ── Stop camera ──
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // ── Start camera ──
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    setCameraReady(false);
    setCameraError("");
    stopCamera();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("notsupported");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: false,
      });

      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities?.();
        if (capabilities && "torch" in capabilities) {
          setTorchSupported(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => setCameraReady(true);
      }
    } catch (err: unknown) {
      let msg = "No se pudo acceder a la cámara.";
      if (err instanceof Error && err.message === "notsupported") {
        msg = "Tu navegador no soporta acceso a la cámara.";
      } else if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError": msg = "Permiso de cámara denegado."; break;
          case "NotFoundError": msg = "No se encontró una cámara."; break;
          case "AbortError":
          case "NotReadableError": msg = "La cámara no respondió. Puede estar en uso por otra app."; break;
        }
      }
      setCameraError(msg);
    }
  }, [stopCamera]);

  // ── Init camera ──
  useEffect(() => {
    if (step === "live") {
      startCamera(facingMode);
    }
    return stopCamera;
  }, [facingMode, step, startCamera, stopCamera]);

  // ── Progress animation ──
  useEffect(() => {
    if (step !== "processing") { setProgress(0); return; }
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 8 + 2));
    }, 300);
    return () => clearInterval(interval);
  }, [step]);

  // ── Step 1: Capture photo ──
  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    // Generate preview
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPreviewUrl(dataUrl);

    // Generate blob
    canvas.toBlob((blob) => {
      if (blob) setCapturedBlob(blob);
    }, "image/jpeg", 0.92);

    // Stop camera to free resources
    stopCamera();
    setStep("preview");
  }, [facingMode, stopCamera]);

  // ── Step 2: Send to backend ──
  const handleAnalyze = useCallback(async () => {
    if (!capturedBlob) return;

    setStep("processing");
    const toastId = toast.loading("Verificando identidad...");

    try {
      const data = await comparePhoto(capturedBlob);
      setProgress(100);
      sessionStorage.setItem("verificationResult", JSON.stringify(data));
      toast.success("Verificación completada", { id: toastId });
      setTimeout(() => router.push("/resultado"), 400);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error en la verificación";
      toast.error(message, { id: toastId });
      // Go back to preview so they can retry
      setStep("preview");
    }
  }, [capturedBlob, router]);

  // ── Retake: discard and go back to live ──
  const handleRetake = () => {
    setCapturedBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStep("live");
  };

  // ── Toggle torch ──
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    const newState = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: newState } as MediaTrackConstraintSet] });
      setTorchOn(newState);
    } catch {
      toast.error("No se pudo activar la linterna");
    }
  }, [torchOn]);

  // ── Switch camera ──
  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // ── Main button handler ──
  const handleMainButton = () => {
    if (step === "live") handleCapture();
    else if (step === "preview") handleAnalyze();
  };

  const mainButtonEnabled =
    (step === "live" && cameraReady) ||
    (step === "preview" && capturedBlob !== null) ||
    false; // processing handled by step check

  return (
    <main className="min-h-[100dvh] relative flex flex-col bg-white text-slate-800">
      <DecoratedBackground opacity={0.3} />
      <canvas ref={canvasRef} className="hidden" />

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

        {/* Instructions */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#ebfcf1] rounded-full flex items-center justify-center mb-3">
            <User className="w-7 h-7 sm:w-8 sm:h-8 text-[#00a859]" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">
            {step === "live" ? "Centra tu rostro" : step === "preview" ? "Foto capturada" : "Analizando..."}
          </h2>
          <p className="text-[#64748b] text-xs sm:text-sm mt-1">
            {step === "live" && "Mantén una expresión neutral y captura"}
            {step === "preview" && "Presiona el botón verde para verificar"}
            {step === "processing" && "Verificando identidad"}
          </p>
        </div>

        {/* Viewfinder */}
        <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] mx-auto mb-6 sm:mb-8">
          {/* Corner brackets */}
          <div className={`absolute -top-1 -left-1 w-7 h-7 sm:w-8 sm:h-8 border-t-4 border-l-4 rounded-tl-xl z-20 transition-colors ${step === "preview" ? "border-[#22c55e]" : "border-[#00a859]"}`} />
          <div className={`absolute -top-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 border-t-4 border-r-4 rounded-tr-xl z-20 transition-colors ${step === "preview" ? "border-[#22c55e]" : "border-[#00a859]"}`} />
          <div className={`absolute -bottom-1 -left-1 w-7 h-7 sm:w-8 sm:h-8 border-b-4 border-l-4 rounded-bl-xl z-20 transition-colors ${step === "preview" ? "border-[#22c55e]" : "border-[#00a859]"}`} />
          <div className={`absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 border-b-4 border-r-4 rounded-br-xl z-20 transition-colors ${step === "preview" ? "border-[#22c55e]" : "border-[#00a859]"}`} />

          <div className="absolute inset-2 bg-[#2a2d2f] rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
            {/* Live camera */}
            {step === "live" && (
              <>
                {cameraError ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400 px-4 text-center">
                    <Camera className="w-10 h-10 text-slate-500" />
                    <p className="text-xs leading-tight">{cameraError}</p>
                    <button onClick={() => startCamera(facingMode)} className="mt-1 text-[#00a859] text-xs font-bold underline">
                      Reintentar
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
                      style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
                    />
                    {!cameraReady && (
                      <div className="absolute inset-0 bg-[#2a2d2f] flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-[#00a859] animate-spin" />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Preview of captured photo */}
            {(step === "preview" || step === "processing") && previewUrl && (
              <img src={previewUrl} alt="Captura" className="absolute inset-0 w-full h-full object-cover" />
            )}

            {/* Scan overlay when processing */}
            {step === "processing" && (
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

          {/* Retake button on preview */}
          {step === "preview" && (
            <button
              onClick={handleRetake}
              className="absolute -top-2 -right-2 w-8 h-8 bg-[#ef4444] rounded-full flex items-center justify-center text-white shadow-lg z-30 active:scale-90 transition-transform"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {step === "processing" && (
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

        {/* Bottom Actions */}
        <div className="flex justify-center items-center gap-5 sm:gap-6 mt-auto pb-4">
          {/* Left button: Torch (live) or hidden (preview/processing) */}
          <button
            onClick={step === "live" ? toggleTorch : undefined}
            disabled={step !== "live" || !torchSupported}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border flex items-center justify-center transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              torchOn
                ? "bg-[#fef9c3] border-[#facc15] text-[#a16207]"
                : "bg-[#f8fafc] border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Sun className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Main button: Capture (live) → Analyze (preview) */}
          <button
            onClick={handleMainButton}
            disabled={!mainButtonEnabled}
            className="rounded-full bg-[#00a859] flex items-center justify-center text-white hover:bg-[#00924d] active:scale-95 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ width: "4.5rem", height: "4.5rem" }}
          >
            {step === "processing" ? (
              <Loader2 className="w-9 h-9 animate-spin" />
            ) : (
              <Fingerprint className="w-9 h-9 sm:w-10 sm:h-10" />
            )}
          </button>

          {/* Right button: Switch camera (live) or Retake (preview) */}
          <button
            onClick={step === "live" ? switchCamera : step === "preview" ? handleRetake : undefined}
            disabled={step === "processing"}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#f8fafc] border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
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
