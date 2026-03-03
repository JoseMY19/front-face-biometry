"use client";

import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera, FlipHorizontal, RefreshCw, Upload, X } from "lucide-react";
import clsx from "clsx";

interface Props {
  onCapture: (blob: Blob) => void;
  disabled?: boolean;
}

export default function CameraCapture({ onCapture, disabled }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [mirrored, setMirrored] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState(false);

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    setPreview(imageSrc);

    // Convert data-URL to Blob
    fetch(imageSrc)
      .then((r) => r.blob())
      .then((blob) => setCapturedBlob(blob));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedBlob(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRetake = () => {
    setPreview(null);
    setCapturedBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (capturedBlob) onCapture(capturedBlob);
  };

  return (
    <div className="card p-3 sm:p-5 space-y-3 sm:space-y-4">
      {/* Mode switcher */}
      <div className="flex gap-2">
        {(["camera", "upload"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); handleRetake(); }}
            className={clsx(
              "flex-1 py-2 rounded-xl text-sm font-medium transition-colors",
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-slate-400 hover:text-slate-200"
            )}
          >
            {m === "camera" ? "Cámara en vivo" : "Subir imagen"}
          </button>
        ))}
      </div>

      {/* Preview / Camera */}
      <div className="relative aspect-[4/3] sm:aspect-video rounded-xl overflow-hidden bg-black border border-[#1e1e2e]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Captura" className="w-full h-full object-cover" />
        ) : mode === "camera" ? (
          cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Camera className="w-10 h-10" />
              <p className="text-sm">No se pudo acceder a la cámara</p>
              <button
                onClick={() => setCameraError(false)}
                className="text-blue-400 hover:text-blue-300 text-xs underline"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              mirrored={facingMode === "user" ? mirrored : false}
              className="w-full h-full object-cover"
              onUserMediaError={() => setCameraError(true)}
              videoConstraints={{ facingMode }}
            />
          )
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-3 cursor-pointer hover:bg-white/5 transition-colors"
          >
            <Upload className="w-10 h-10" />
            <p className="text-sm">Haz clic para seleccionar una imagen</p>
            <p className="text-xs text-slate-600">JPG, PNG, WEBP — máx. 10 MB</p>
          </div>
        )}

        {/* Camera controls (no preview) */}
        {mode === "camera" && !preview && !cameraError && (
          <div className="absolute top-2 right-2 flex gap-1">
            {/* Flip front/rear — useful on mobile */}
            <button
              onClick={() => { setFacingMode((v) => v === "user" ? "environment" : "user"); setCameraError(false); }}
              className="p-2 rounded-lg bg-black/60 text-slate-400 hover:text-white transition-colors"
              title="Cambiar cámara (frontal / trasera)"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {/* Mirror toggle (front camera only) */}
            {facingMode === "user" && (
              <button
                onClick={() => setMirrored((v) => !v)}
                className="p-2 rounded-lg bg-black/60 text-slate-400 hover:text-white transition-colors"
                title="Voltear imagen"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Retake overlay */}
        {preview && (
          <button
            onClick={handleRetake}
            className="absolute top-2 right-2 p-2 rounded-lg bg-black/70 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Action buttons */}
      <div className="flex gap-3">
        {!preview && mode === "camera" && (
          <button
            onClick={handleCapture}
            disabled={disabled || cameraError}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Capturar foto
          </button>
        )}

        {!preview && mode === "upload" && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="btn-ghost flex-1 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Seleccionar imagen
          </button>
        )}

        {preview && (
          <>
            <button
              onClick={handleRetake}
              disabled={disabled}
              className="btn-ghost flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retomar
            </button>
            <button
              onClick={handleSubmit}
              disabled={disabled}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <ScanFaceIcon />
              Comparar con BD
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ScanFaceIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 21H5a2 2 0 01-2-2v-4m6 6h10a2 2 0 002-2v-4M9 12a3 3 0 106 0 3 3 0 00-6 0z" />
    </svg>
  );
}
