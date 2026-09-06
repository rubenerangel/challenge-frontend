"use client";

import { useState } from "react";
import { guardarNota } from "@/lib/guardar-nota";

type Estado = "vacio" | "guardando" | "guardado" | "error";

export function FormularioNota() {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado>("vacio");

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstado("guardando");

    try {
      await guardarNota(texto);
      setEstado("guardado");
    } catch {
      setEstado("error");
    }
  }

  return (
    <div className="relative">
      <form onSubmit={alEnviar} className="flex flex-col gap-3">
        <label htmlFor="nota" className="text-sm font-medium text-slate-700">
          Tu nota
        </label>

        <textarea
          id="nota"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            setEstado("vacio");
          }}
          rows={4}
          placeholder="Escribe algo…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={estado === "guardando" || texto.trim() === ""}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {estado === "guardando" ? "Guardando…" : "Guardar"}
          </button>

          {estado === "guardado" && (
            <span role="status" className="text-sm text-emerald-700">
              Guardado
            </span>
          )}
        </div>
      </form>

      {estado === "error" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            className="flex flex-col gap-4 rounded-lg bg-white p-5 text-center shadow-lg"
          >
            <p className="text-sm font-medium text-slate-900">
              La nota NO ha sido guardada, vuelve a intentar
            </p>
            <button
              type="button"
              onClick={() => setEstado("vacio")}
              className="self-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
