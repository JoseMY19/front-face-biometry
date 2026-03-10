"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Sun, SwitchCamera, Loader2, Camera, Check } from "lucide-react";
import DecoratedBackground from "@/components/DecoratedBackground";
import logo from "@/src/assets/logo/logo.webp";
import { useState, useRef, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { comparePhoto } from "@/lib/api";

type CameraState = "loading" | "ready" | "error";
type DetectionState = "searching" | "detected" | "countdown" | "captured";

export default function VerificationPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<unknown>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("loading");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [detection, setDetection] = useState<DetectionState>("searching");
  const [countdown, setCountdown] = useState(0);
  const [faceGuide, setFaceGuide] = useState<string>("Buscando rostro...");

  // ── Stop camera ──
  const stopCamera = useCallback(() => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // ── Face detection loop ──
  const startDetectionLoop = useCallback(() => {
    // Use browser FaceDetector API (Chrome/Edge)
    const FaceDetectorClass = (window as unknown as Record<string, unknown>).FaceDetector as
      | (new (opts?: Record<string, unknown>) => { detect: (source: HTMLVideoElement) => Promise<Array<{ boundingBox: DOMRect }>> })
      | undefined;

    if (!FaceDetectorClass) {
      // FaceDetector not supported — auto-capture after 3s
      setFaceGuide("Centra tu rostro y espera...");
      setDetection("detected");
      let count = 3;
      setCountdown(count);
      setDetection("countdown");

      const tick = () => {
        count--;
        if (count <= 0) {
          setDetection("captured");
          setCountdown(0);
          return;
        }
        setCountdown(count);
        countdownRef.current = setTimeout(tick, 1000);
      };
      countdownRef.current = setTimeout(tick, 1000);
      return;
    }

    const detector = new FaceDetectorClass({ fastMode: true, maxDetectedFaces: 1 });
    detectorRef.current = detector;

    let stableFrames = 0;
    const STABLE_THRESHOLD = 8; // ~8 frames of stable face = start countdown

    const loop = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        detectionLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      try {
        const faces = await detector.detect(videoRef.current);

        if (faces.length > 0) {
          const face = faces[0];
          const vw = videoRef.current.videoWidth;
          const vh = videoRef.current.videoHeight;
          const box = face.boundingBox;

          // Check face is reasonably centered and sized
          const centerX = (box.x + box.width / 2) / vw;
          const centerY = (box.y + box.height / 2) / vh;
          const faceRatio = (box.width * box.height) / (vw * vh);

          const isCentered = centerX > 0.25 && centerX < 0.75 && centerY > 0.2 && centerY < 0.8;
          const isGoodSize = faceRatio > 0.04; // Face covers at least 4% of frame

          if (isCentered && isGoodSize) {
            stableFrames++;
            setDetection("detected");
            setFaceGuide("Rostro detectado, no te muevas");

            if (stableFrames >= STABLE_THRESHOLD) {
              // Start countdown
              setDetection("countdown");
              let count = 3;
              setCountdown(count);

              const tick = () => {
                count--;
                if (count <= 0) {
                  setDetection("captured");
                  setCountdown(0);
                  return;
                }
                setCountdown(count);
                countdownRef.current = setTimeout(tick, 1000);
              };
              countdownRef.current = setTimeout(tick, 1000);
              return; // Stop detection loop
            }
          } else {
            stableFrames = Math.max(0, stableFrames - 2);
            setDetection("searching");
            if (!isCentered) setFaceGuide("Centra tu rostro en el recuadro");
            else if (!isGoodSize) setFaceGuide("Acércate más a la cámara");
          }
        } else {
          stableFrames = 0;
          setDetection("searching");
          setFaceGuide("Buscando rostro...");
        }
      } catch {
        // Detection failed silently, retry
      }

      detectionLoopRef.current = requestAnimationFrame(loop);
    };

    detectionLoopRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Start camera ──
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    setCameraState("loading");
    setErrorMsg("");
    setDetection("searching");
    setCountdown(0);
    setFaceGuide("Buscando rostro...");
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
        videoRef.current.onloadeddata = () => {
          setCameraState("ready");
          startDetectionLoop();
        };
      }
    } catch (err: unknown) {
      console.error("Camera error:", err);
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
      setErrorMsg(msg);
      setCameraState("error");
    }
  }, [stopCamera, startDetectionLoop]);

  // ── Init camera ──
  useEffect(() => {
    startCamera(facingMode);
    return stopCamera;
  }, [facingMode, startCamera, stopCamera]);

  // ── Auto-capture when detection says "captured" ──
  useEffect(() => {
    if (detection !== "captured" || processing) return;
    captureAndSend();
  }, [detection]);

  // ── Progress animation ──
  useEffect(() => {
    if (!processing) { setProgress(0); return; }
    const interval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 8 + 2));
    }, 300);
    return () => clearInterval(interval);
  }, [processing]);

  // ── Capture and send ──
  const captureAndSend = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

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

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    if (!blob) { toast.error("No se pudo capturar"); return; }

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
      // Restart detection
      setDetection("searching");
      setCountdown(0);
      startDetectionLoop();
    }
  }, [processing, facingMode, router, startDetectionLoop]);

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

  // ── Border color based on detection state ──
  const borderColor =
    detection === "searching" ? "border-[#00a859]" :
    detection === "detected" ? "border-[#facc15]" :
    detection === "countdown" ? "border-[#22c55e]" :
    "border-[#22c55e]";

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

        {/* Status indicator */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 transition-colors duration-300 ${
            detection === "searching" ? "bg-[#ebfcf1]" :
            detection === "detected" ? "bg-[#fef9c3]" :
            detection === "countdown" ? "bg-[#dcfce7]" :
            "bg-[#dcfce7]"
          }`}>
            {detection === "countdown" ? (
              <span className="text-2xl font-black text-[#16a34a]">{countdown}</span>
            ) : detection === "captured" || processing ? (
              <Check className="w-7 h-7 sm:w-8 sm:h-8 text-[#16a34a]" />
            ) : (
              <User className="w-7 h-7 sm:w-8 sm:h-8 text-[#00a859]" />
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0f172a]">
            {processing ? "Analizando..." : detection === "countdown" ? "No te muevas" : "Centra tu rostro"}
          </h2>
          <p className="text-[#64748b] text-xs sm:text-sm mt-1">
            {processing ? "Verificando identidad" : faceGuide}
          </p>
        </div>

        {/* Camera Area */}
        <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] mx-auto mb-6 sm:mb-8">
          {/* Corner brackets - color changes with detection */}
          <div className={`absolute -top-1 -left-1 w-7 h-7 sm:w-8 sm:h-8 border-t-4 border-l-4 ${borderColor} rounded-tl-xl z-20 transition-colors duration-300`} />
          <div className={`absolute -top-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 border-t-4 border-r-4 ${borderColor} rounded-tr-xl z-20 transition-colors duration-300`} />
          <div className={`absolute -bottom-1 -left-1 w-7 h-7 sm:w-8 sm:h-8 border-b-4 border-l-4 ${borderColor} rounded-bl-xl z-20 transition-colors duration-300`} />
          <div className={`absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 border-b-4 border-r-4 ${borderColor} rounded-br-xl z-20 transition-colors duration-300`} />

          <div className="absolute inset-2 bg-[#2a2d2f] rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
            {cameraState === "error" ? (
              <div className="flex flex-col items-center gap-2 text-slate-400 px-4 text-center">
                <Camera className="w-10 h-10 text-slate-500" />
                <p className="text-xs leading-tight">{errorMsg}</p>
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
                {cameraState === "loading" && (
                  <div className="absolute inset-0 bg-[#2a2d2f] flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-[#00a859] animate-spin" />
                  </div>
                )}

                {/* Countdown overlay */}
                {detection === "countdown" && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-4xl font-black text-white">{countdown}</span>
                    </div>
                  </div>
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

        {/* Bottom Actions */}
        <div className="flex justify-center items-center gap-5 sm:gap-6 mt-auto pb-4">
          {/* Torch */}
          <button
            onClick={toggleTorch}
            disabled={!torchSupported || processing}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border flex items-center justify-center transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              torchOn
                ? "bg-[#fef9c3] border-[#facc15] text-[#a16207]"
                : "bg-[#f8fafc] border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Sun className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Status indicator (replaces capture button) */}
          <div
            className={`rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
              processing ? "bg-[#00a859] shadow-green-500/30" :
              detection === "countdown" ? "bg-[#22c55e] shadow-green-500/30 animate-pulse" :
              detection === "detected" ? "bg-[#eab308] shadow-yellow-500/30" :
              "bg-[#00a859]/60 shadow-green-500/20"
            }`}
            style={{ width: "4.5rem", height: "4.5rem" }}
          >
            {processing ? (
              <Loader2 className="w-9 h-9 animate-spin" />
            ) : detection === "countdown" ? (
              <span className="text-2xl font-black">{countdown}</span>
            ) : detection === "detected" ? (
              <User className="w-9 h-9" />
            ) : (
              <User className="w-9 h-9 opacity-50" />
            )}
          </div>

          {/* Switch camera */}
          <button
            onClick={switchCamera}
            disabled={processing}
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
