import type { CompareResponse } from "@/types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

// ─── Compare ─────────────────────────────────────────────────────────────────

export async function comparePhoto(photo: File | Blob): Promise<CompareResponse> {
  const form = new FormData();
  form.append("photo", photo, "capture.jpg");
  const res = await fetch(`${API_BASE}/api/compare`, { method: "POST", body: form });
  return handleResponse<CompareResponse>(res);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function photoUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}
