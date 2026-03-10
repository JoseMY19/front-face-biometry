"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import DecoratedBackground from "@/components/DecoratedBackground";
import logo from "@/src/assets/logo/logo.webp";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate navigation to the verification page
    window.location.href = "/verificacion";
  };

  return (
    <main className="min-h-[100dvh] relative flex items-center justify-center bg-white text-slate-800 px-4 py-8">
      <DecoratedBackground opacity={1} />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="mb-6 sm:mb-8 w-56 sm:w-64">
          <Image
            src={logo}
            alt="San Juan de Lurigancho"
            className="w-full h-auto"
            priority
          />
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] mb-1.5">Bienvenido</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            Por favor, ingrese sus credenciales para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#0f172a]">
              Correo
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 sm:py-3.5 bg-blue-50/50 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-slate-700 text-sm sm:text-base"
              placeholder="usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="block text-sm font-bold text-[#0f172a]">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 sm:py-3.5 bg-blue-50/50 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-slate-700 font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans text-sm sm:text-base"
                placeholder="contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1 pb-3 sm:pb-4">
            <input
              type="checkbox"
              id="remember"
              className="w-4 h-4 rounded border-slate-300 text-[#00a859] focus:ring-[#00a859]"
            />
            <label
              htmlFor="remember"
              className="text-sm font-bold text-[#0f172a]"
            >
              Recordar mi usuario
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-[#00a859] hover:bg-[#00924d] active:bg-[#007b41] text-white font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-[0.98]"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </main>
  );
}
