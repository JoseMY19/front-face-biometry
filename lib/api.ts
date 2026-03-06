import type { Person, CompareResponse, HistoryItem } from "@/types";

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

// ─── Persons ─────────────────────────────────────────────────────────────────

export async function getPersons(): Promise<Person[]> {
  const res = await fetch(`${API_BASE}/api/persons`);
  return handleResponse<Person[]>(res);
}

export async function addPerson(name:string,photo:File): Promise<Person> {
  const form = new FormData();
  form.append("name", name);
  form.append("photos", photo);
  const res = await fetch(`${API_BASE}/api/persons`, { method: "POST", body: form });
  return handleResponse<Person>(res);
}

export async function deletePerson(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/persons/${id}`, { method: "DELETE" });
  await handleResponse<unknown>(res);
}

export async function deleteAllPersons(): Promise<{ deleted: number }> {
  const res = await fetch(`${API_BASE}/api/persons/all`, { method: "DELETE" });
  return handleResponse<{ deleted: number }>(res);
}

// ─── Compare ─────────────────────────────────────────────────────────────────

export async function comparePhoto(photo: File | Blob): Promise<CompareResponse> {
  const form = new FormData();
  form.append("photo", photo, "capture.jpg");
  const res = await fetch(`${API_BASE}/api/compare`, { method: "POST", body: form });
  return handleResponse<CompareResponse>(res);
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${API_BASE}/api/history`);
  return handleResponse<HistoryItem[]>(res);
}

export async function deleteComparison(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/history/${id}`, { method: "DELETE" });
  await handleResponse<unknown>(res);
}

export async function deleteAllHistory(): Promise<{ deleted: number }> {
  const res = await fetch(`${API_BASE}/api/history`, { method: "DELETE" });
  return handleResponse<{ deleted: number }>(res);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function photoUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}
