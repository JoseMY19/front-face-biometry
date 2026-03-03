"use client";

import ReactMarkdown from "react-markdown";
import { CheckCircle, XCircle, Glasses, User, Smile, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import type { CompareResponse, MatchResult } from "@/types";
import { photoUrl } from "@/lib/api";

interface Props {
  data: CompareResponse;
}

export default function ComparisonResults({ data }: Props) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? data.results : data.results.slice(0, 5);

  const best = data.best_match;
  const isIdentified = best?.is_match ?? false;

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* ── Veredicto ── */}
      <div
        className={clsx(
          "card p-4 sm:p-5 border-l-4",
          isIdentified ? "border-l-emerald-500" : "border-l-red-500"
        )}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl(data.query_photo_url)}
            alt="Consulta"
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#1e1e2e] shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              {isIdentified ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
              )}
              <span
                className={clsx(
                  "font-semibold text-base sm:text-lg",
                  isIdentified ? "text-emerald-400" : "text-red-400"
                )}
              >
                {isIdentified ? "IDENTIFICADA" : "NO IDENTIFICADA"}
              </span>
            </div>

            {best && (
              <p className="text-slate-300 text-xs sm:text-sm">
                <span className="font-medium text-white">{best.name}</span>
                {" — "}
                <span className="font-mono text-blue-400">{best.similarity_percentage.toFixed(1)}%</span>
                {" de similitud"}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
              <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                {data.total_compared} comparadas
              </span>
              <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                {data.matches_found} coincidencias
              </span>
              {data.detection.has_glasses && (
                <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1">
                  <Glasses className="w-3 h-3" /> Lentes
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Resultados por persona ── */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-[#1e1e2e] flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-sm">Resultados por persona</span>
        </div>
        <div className="divide-y divide-[#1e1e2e]">
          {displayed.map((r) => (
            <PersonRow key={r.person_id} result={r} />
          ))}
        </div>
        {data.results.length > 5 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="w-full py-3 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors flex items-center justify-center gap-1"
          >
            {showAll ? (
              <><ChevronUp className="w-4 h-4" /> Mostrar menos</>
            ) : (
              <><ChevronDown className="w-4 h-4" /> Ver {data.results.length - 5} más</>
            )}
          </button>
        )}
      </div>

      {/* ── Atributos faciales + Detección ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Facial attributes */}
        {data.face_analysis && !data.face_analysis.error && (
          <div className="card p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Smile className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-xs sm:text-sm">Atributos</span>
            </div>
            <dl className="space-y-2 text-xs sm:text-sm">
              <Attr label="Género" value={data.face_analysis.dominant_gender ?? "—"} />
              <Attr label="Emoción" value={data.face_analysis.dominant_emotion ?? "—"} />
            </dl>
          </div>
        )}

        {/* Detection */}
        <div className="card p-3 sm:p-5">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Glasses className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-xs sm:text-sm">Detección</span>
          </div>
          <dl className="space-y-2 text-xs sm:text-sm">
            <Attr
              label="Personas"
              value={String(data.detection.persons_count)}
            />
            <Attr
              label="Lentes"
              value={data.detection.has_glasses ? "Sí" : "No"}
              highlight={data.detection.has_glasses ? "amber" : undefined}
            />
            <Attr
              label="Objetos"
              value={String(data.detection.total_objects)}
            />
          </dl>
        </div>
      </div>

      {/* ── LLM Analysis ── */}
      {data.llm_analysis && (
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Bot className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-sm">Informe biométrico (IA)</span>
          </div>
          <div className="prose prose-sm prose-invert max-w-none text-slate-300 leading-relaxed text-sm">
            <ReactMarkdown>{data.llm_analysis}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonRow({ result }: { result: MatchResult }) {
  const pct = result.similarity_percentage;
  const barColor =
    pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500/60";

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl(result.photo_url)}
        alt={result.name}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover border border-[#1e1e2e] shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs sm:text-sm font-medium truncate">{result.name}</span>
          <div className="flex items-center gap-1.5 sm:gap-2 ml-2 shrink-0">
            <span className="font-mono text-xs sm:text-sm tabular-nums">
              {pct.toFixed(1)}%
            </span>
            {result.is_match ? (
              <span className="badge-match">✓</span>
            ) : (
              <span className="badge-no-match">✗</span>
            )}
          </div>
        </div>
        {/* Similarity bar */}
        <div className="h-1 sm:h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all", barColor)}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Attr({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "amber";
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={clsx(
          "font-medium capitalize",
          highlight === "amber" ? "text-amber-400" : "text-slate-200"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
