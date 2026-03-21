import type { CompareResponse } from "@/types";

// In production, calls go directly to the backend URL.
// In development, calls go through Next.js rewrite proxy (/backend/...) so
// the phone only talks to the frontend server — no CORS or HTTPS issues.
function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  // Use the proxy route — works from any device since it's same-origin
  if (typeof window !== "undefined") {
    return `${window.location.origin}/backend`;
  }
  return "http://172.16.10.10:8000";
}

function getGestionateBase(): string {
  const raw = process.env.NEXT_PUBLIC_GESTIONATE_URL ?? "http://172.16.10.10:3000";
  return raw.replace(/\/+$/, "");
}

// ─── Auth helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("auth_token");
}

export function getAuthRole(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("auth_role");
}

export function clearAuth(): void {
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_role");
  sessionStorage.removeItem("auth_username");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response, redirectOnUnauth = true): Promise<T> {
  if (res.status === 401) {
    clearAuth();
    let detail = "Usuario o contraseña incorrectos";
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch { }
    if (redirectOnUnauth && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error(detail);
  }
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch { }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  username: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const body = new URLSearchParams({ username, password });
  const res = await fetch(`${getApiBase()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await handleResponse<LoginResponse>(res);

  // Guardar token en sessionStorage
  sessionStorage.setItem("auth_token", data.access_token);
  sessionStorage.setItem("auth_role", data.role);
  sessionStorage.setItem("auth_username", data.username);

  return data;
}

// ─── Compare ─────────────────────────────────────────────────────────────────

export async function comparePhoto(photo: File | Blob): Promise<CompareResponse> {
  const form = new FormData();
  form.append("photo", photo, "capture.jpg");
  const res = await fetch(`${getApiBase()}/api/compare`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  return handleResponse<CompareResponse>(res);
}

// ─── Empleados ───────────────────────────────────────────────────────────────

export async function getEmpleadosByPhoto(photourl: string): Promise<any | null> {
  try {
    const filename = photourl.split("/").pop();
    const res = await fetch(`${getGestionateBase()}/api/empleado/by-photo/${filename}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // Gestionate API not available — silently return null
    return null;
  }
}

 export async function getEmpleadoByDni(dni: string): Promise<any | null> {
    try {
      const res = await fetch(`${getGestionateBase()}/api/empleado/dni/${dni}`);
      if (!res.ok) return null;
      const data = await res.json();
      // Gestionate devuelve {message, data, statusCode} - extrae data
      return data?.data ?? data;
    } catch {
      return null;
    }
  }

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function photoUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${normalizedPath}`;
}
