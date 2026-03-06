"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { History, Loader2, Glasses, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { getHistory, deleteComparison, deleteAllHistory, photoUrl } from "@/lib/api";
import type { HistoryItem } from "@/types";
import clsx from "clsx";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    getHistory()
      .then(setItems)
      .catch(() => toast.error("Error cargando el historial"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDeleteAll() {
    if (!confirm(`¿Eliminar todo el historial (${items.length} comparaciones)?`)) return;
    setDeletingAll(true);
    try {
      const { deleted } = await deleteAllHistory();
      setItems([]);
      toast.success(`${deleted} comparación(es) eliminadas`);
    } catch {
      toast.error("Error al eliminar el historial");
    } finally {
      setDeletingAll(false);
    }
  }

  async function handleDeleteOne(id: number) {
    try {
      await deleteComparison(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Comparación eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <History className="w-6 h-6 text-blue-400" />
            Historial de comparaciones
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Últimas {items.length} comparaciones realizadas
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleDeleteAll}
            disabled={deletingAll}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-sm disabled:opacity-50"
          >
            {deletingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Borrar todo
          </button>
        )}
      </div>

      {loading ? (
        <div className="card p-10 flex items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando historial...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-10 flex flex-col items-center gap-3 text-slate-600">
          <History className="w-12 h-12" />
          <p className="text-sm">No hay comparaciones aún. Ve a Comparar para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <HistoryCard key={item.id} item={item} onDelete={handleDeleteOne} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryCard({
  item,
  onDelete,
}: {
  item: HistoryItem;
  onDelete: (id: number) => void;
}) {
  const isMatch = item.best_match_score != null && item.best_match_score >= 75;
  const [deleting, setDeleting] = useState(false);

  const date = new Date(item.created_at).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleDelete() {
    setDeleting(true);
    await onDelete(item.id);
    setDeleting(false);
  }

  return (
    <div className="card p-4 space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl(item.query_photo_url)}
        alt="Consulta"
        className="w-full h-40 object-cover rounded-xl border border-[#1e1e2e]"
      />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {isMatch ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span
            className={clsx(
              "text-sm font-medium truncate",
              isMatch ? "text-emerald-400" : "text-red-400"
            )}
          >
            {item.best_match_name
              ? `${item.best_match_name} — ${item.best_match_score?.toFixed(1)}%`
              : "Sin coincidencia"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{date}</span>
          <div className="flex items-center gap-2">
            {item.has_glasses && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <Glasses className="w-3 h-3" /> Lentes
              </span>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-slate-600 hover:text-red-400 transition"
              title="Eliminar"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
