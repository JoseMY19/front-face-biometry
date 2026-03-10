"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Database, Plus, Loader2, Upload, Users, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import PersonCard from "@/components/PersonCard";
import { getPersons, addPerson, deletePerson, deleteAllPersons } from "@/lib/api";
import type { Person } from "@/types";

const PAGE_SIZE = 20;

export default function DatabasePage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (p = page) => {
    try {
      const data = await getPersons(p, PAGE_SIZE);
      setPersons(data.persons);
      setTotal(data.total);
      setPage(p);
    } catch {
      toast.error("Error cargando la base de datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !file) {
      toast.error("Completa el nombre y selecciona una foto");
      return;
    }

    setAdding(true);
    const toastId = toast.loading(`Procesando a ${name}...`);

    try {
      await addPerson(name.trim(), file);
      toast.success(`'${name}' agregado correctamente`, { id: toastId });
      setName("");
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al agregar";
      toast.error(msg, { id: toastId });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deletePerson(id);
      toast.success("Persona eliminada");
      await load();
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      const { deleted } = await deleteAllPersons();
      toast.success(`${deleted} persona(s) eliminadas`);
      setPersons([]);
      setTotal(0);
      setPage(1);
    } catch {
      toast.error("Error al borrar la base de datos");
    } finally {
      setClearingAll(false);
      setClearConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <Database className="w-6 h-6 text-blue-400" />
          Base de datos biométrica
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Gestiona las personas de referencia. Sube fotos frontales y claras para mejores resultados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* ── Add person form ── */}
        <div className="lg:col-span-2">
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              <span className="font-medium">Agregar persona</span>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              {/* Name input */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-white/5 border border-[#2a2a3e] rounded-xl px-3 py-2.5 text-sm
                             text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60
                             focus:bg-white/8 transition-colors"
                  disabled={adding}
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Foto de referencia</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative cursor-pointer border border-dashed border-[#2a2a3e] hover:border-blue-500/50
                             rounded-xl overflow-hidden transition-colors"
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-2">
                      <Upload className="w-8 h-8" />
                      <p className="text-xs">Haz clic para seleccionar</p>
                      <p className="text-xs text-slate-600">JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <button
                type="submit"
                disabled={adding || !name.trim() || !file}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {adding ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Agregar a la BD</>
                )}
              </button>
            </form>

            <p className="text-xs text-slate-500">
              ArcFace calculará el embedding facial automáticamente al agregar la foto.
            </p>
          </div>
        </div>

        {/* ── Persons list ── */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Users className="w-4 h-4" />
              <span>
                {loading ? "Cargando..." : `${total} persona${total !== 1 ? "s" : ""} en la BD`}
              </span>
            </div>
            {total > 0 && !clearConfirm && (
              <button
                onClick={() => setClearConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300
                           border border-red-800/50 hover:border-red-600/60 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Borrar todo
              </button>
            )}
            {clearConfirm && (
              <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/50 rounded-xl px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs text-red-300">¿Borrar {total} persona(s)?</span>
                <button
                  onClick={handleClearAll}
                  disabled={clearingAll}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg
                             disabled:opacity-50 transition-colors ml-1"
                >
                  {clearingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sí, borrar"}
                </button>
                <button
                  onClick={() => setClearConfirm(false)}
                  disabled={clearingAll}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="card p-10 flex items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : persons.length === 0 && total === 0 ? (
            <div className="card p-10 flex flex-col items-center gap-3 text-slate-600">
              <Database className="w-12 h-12" />
              <p className="text-center text-sm">
                La base de datos está vacía.
                <br />
                Agrega personas para comenzar a comparar.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {persons.map((p) => (
                  <PersonCard
                    key={p.id}
                    person={p}
                    onDelete={handleDelete}
                    deleting={deletingId === p.id}
                  />
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => load(page - 1)}
                    disabled={page <= 1}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200
                               border border-[#2a2a3e] hover:border-blue-500/50 px-3 py-1.5 rounded-lg
                               transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Anterior
                  </button>
                  <span className="text-xs text-slate-500">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => load(page + 1)}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200
                               border border-[#2a2a3e] hover:border-blue-500/50 px-3 py-1.5 rounded-lg
                               transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Siguiente
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
