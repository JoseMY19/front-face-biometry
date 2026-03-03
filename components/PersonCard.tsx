"use client";

import { Trash2, CheckCircle } from "lucide-react";
import type { Person } from "@/types";
import { photoUrl } from "@/lib/api";

interface Props {
  person: Person;
  onDelete: (id: number) => void;
  deleting?: boolean;
}

export default function PersonCard({ person, onDelete, deleting }: Props) {
  const date = new Date(person.created_at).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="card p-4 flex items-center gap-4 group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl(person.photo_url)}
        alt={person.name}
        className="w-14 h-14 rounded-xl object-cover border border-[#1e1e2e] shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{person.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">Agregado: {date}</p>
        {person.has_embedding && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 mt-1">
            <CheckCircle className="w-3 h-3" />
            Embedding calculado
          </span>
        )}
      </div>
      <button
        onClick={() => onDelete(person.id)}
        disabled={deleting}
        className="btn-danger disabled:opacity-40"
        title="Eliminar persona"
      >
        {deleting ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
