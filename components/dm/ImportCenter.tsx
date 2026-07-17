"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { ValidationEngine } from "@/lib/mythos/validation";
import { importCampaignPack, importSessionPack } from "@/lib/mythos/importer";
import type { CampaignPack, SessionPack, ValidationResult } from "@/lib/mythos/schema";

type ImportCenterProps = {
  sessionId: string;
  onImport: () => void;
  onClose: () => void;
};

type ImportMode = "campaign" | "session";

interface ImportState {
  mode: ImportMode;
  jsonText: string;
  dmPassword: string;
  dragOver: boolean;
  step: "input" | "validate" | "import" | "done";
  validation: ValidationResult | null;
  progress: { current: number; message: string };
  result: { success: boolean; sessionId?: string; code?: string; entities?: Record<string, number> } | null;
}

export function ImportCenter({ sessionId, onImport, onClose }: ImportCenterProps) {
  const [state, setState] = useState<ImportState>({
    mode: "campaign",
    jsonText: "",
    dmPassword: "",
    dragOver: false,
    step: "input",
    validation: null,
    progress: { current: 0, message: "" },
    result: null,
  });
  const textRef = useRef<HTMLTextAreaElement>(null);

  const setPartial = (partial: Partial<ImportState>) => setState(prev => ({ ...prev, ...partial }));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPartial({ dragOver: false });
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith(".json")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPartial({ jsonText: text, step: "input", validation: null, result: null });
    };
    reader.readAsText(file);
  }, []);

  const handleValidate = () => {
    if (!state.jsonText.trim()) return;
    let parsed: any;
    try {
      parsed = JSON.parse(state.jsonText);
    } catch {
      return;
    }

    const engine = new ValidationEngine();
    const result = state.mode === "campaign"
      ? engine.validateCampaignPack(parsed)
      : engine.validateSessionPack(parsed);

    setPartial({ validation: result, step: result.valid ? "validate" : "validate" });
  };

  const handleImport = async () => {
    if (!state.validation?.valid) return;
    let parsed: any;
    try {
      parsed = JSON.parse(state.jsonText);
    } catch { return; }

    setPartial({ step: "import", progress: { current: 0, message: "Avvio importazione..." } });

    const onProgress = (current: number, message: string) => {
      setPartial({ progress: { current, message } });
    };

    let result;
    if (state.mode === "campaign") {
      result = await importCampaignPack(parsed as CampaignPack, state.dmPassword, onProgress);
    } else {
      result = await importSessionPack(sessionId, parsed as SessionPack, onProgress);
    }

    setPartial({
      step: "done",
      result: {
        success: result.success,
        sessionId: result.sessionId,
        code: result.code,
        entities: result.report.entitiesCreated,
      },
      progress: { current: 100, message: result.success ? "Completato!" : "Errore durante l'importazione" },
    });

    if (result.success) {
      setTimeout(() => { onImport(); onClose(); }, 2000);
    }
  };

  const errors = state.validation?.errors || [];
  const warnings = state.validation?.warnings || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[0.08em] text-white">Centro Import</h2>
          <p className="mt-1 text-xs text-white/40">
            Trascina un file JSON o incolla il contenuto. I dati importati popoleranno automaticamente tutte le sezioni.
          </p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white text-lg">&times;</button>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setPartial({ mode: "campaign", validation: null, step: "input", result: null })}
          className={`rounded-xl border px-4 py-2 text-sm transition ${
            state.mode === "campaign"
              ? "border-veil-gold/30 bg-veil-gold/10 text-veil-gold"
              : "border-white/[0.06] bg-black/20 text-white/50 hover:border-white/[0.12]"
          }`}
        >
          Campaign Pack
        </button>
        <button
          onClick={() => setPartial({ mode: "session", validation: null, step: "input", result: null })}
          className={`rounded-xl border px-4 py-2 text-sm transition ${
            state.mode === "session"
              ? "border-veil-gold/30 bg-veil-gold/10 text-veil-gold"
              : "border-white/[0.06] bg-black/20 text-white/50 hover:border-white/[0.12]"
          }`}
        >
          Session Pack
        </button>
      </div>

      {/* DM Password */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/40 uppercase tracking-[0.1em]">Password DM</label>
        <input
          type="password"
          value={state.dmPassword}
          onChange={e => setPartial({ dmPassword: e.target.value })}
          className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-veil-gold/30 focus:outline-none"
          placeholder="Inserisci la password DM..."
        />
      </div>

      {/* JSON input area */}
      <div
        className={`relative rounded-2xl border-2 border-dashed transition ${
          state.dragOver ? "border-veil-gold/40 bg-veil-gold/[0.03]" : "border-white/[0.08] bg-black/20"
        } ${state.step !== "input" ? "hidden" : ""}`}
        onDragOver={e => { e.preventDefault(); setPartial({ dragOver: true }); }}
        onDragLeave={() => setPartial({ dragOver: false })}
        onDrop={handleDrop}
      >
        <textarea
          ref={textRef}
          className="w-full bg-transparent p-5 font-mono text-xs text-white/60 placeholder-white/15 resize-none focus:outline-none"
          rows={16}
          placeholder={`Trascina un file .json qui, o incolla il contenuto del ${state.mode === "campaign" ? "Campaign Pack" : "Session Pack"}...`}
          value={state.jsonText}
          onChange={e => setPartial({ jsonText: e.target.value, validation: null, result: null, step: e.target.value.trim() ? "input" : "input" })}
        />
        {!state.jsonText.trim() && (
          <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-white/15 pointer-events-none">
            Trascina o incolla il JSON del pack
          </p>
        )}
      </div>

      {/* Actions */}
      {state.step === "input" && state.jsonText.trim() && (
        <div className="flex gap-2">
          <button
            onClick={handleValidate}
            className="rounded-xl border border-veil-gold/20 bg-veil-gold/8 px-6 py-2.5 text-sm text-veil-gold/80 hover:bg-veil-gold/15"
          >
            Valida JSON
          </button>
          <button
            onClick={() => setPartial({ jsonText: "", validation: null })}
            className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-2.5 text-sm text-white/40 hover:border-white/[0.12]"
          >
            Cancella
          </button>
        </div>
      )}

      {/* Validation Results */}
      {state.validation && (
        <div className="space-y-3">
          {errors.length > 0 && (
            <div className="rounded-2xl border border-red-400/20 bg-red-900/10 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-red-300 mb-2">
                {errors.length} errore{errors.length > 1 ? "i" : ""}
              </p>
              <div className="space-y-1">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-200/80">
                    <span className="text-red-300">{err.path}</span>: {err.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-900/10 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-amber-300 mb-2">
                {warnings.length} avvis{warnings.length > 1 ? "i" : "o"}
              </p>
              <div className="space-y-1">
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-200/60">{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Summary preview */}
          {state.validation.summary && (
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-white/30 mb-3">Oggetti rilevati</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(state.validation.summary).filter(([, v]) => v != null && Number(v) > 0).map(([key, val]) => (
                  <div key={key} className="rounded-xl bg-white/[0.03] px-3 py-2 text-center">
                    <p className="text-sm font-semibold text-veil-gold">{String(val)}</p>
                    <p className="text-[10px] text-white/40 capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import button */}
          {state.validation.valid && state.step !== "import" && state.step !== "done" && (
            <button
              onClick={handleImport}
              className="w-full rounded-xl border border-emerald-400/30 bg-emerald-900/20 px-6 py-3 text-sm font-medium text-emerald-300 hover:bg-emerald-900/30 transition"
            >
              Avvia importazione {state.mode === "campaign" ? "campagna" : "sessione"}
            </button>
          )}
        </div>
      )}

      {/* Progress */}
      {state.step === "import" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">{state.progress.message}</span>
            <span className="text-veil-gold">{state.progress.current}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-veil-gold/60 to-veil-gold transition-all"
              style={{ width: `${state.progress.current}%` }}
            />
          </div>
        </div>
      )}

      {/* Done */}
      {state.step === "done" && state.result && (
        <div className={`rounded-2xl border p-5 text-center ${
          state.result.success
            ? "border-emerald-400/20 bg-emerald-900/10"
            : "border-red-400/20 bg-red-900/10"
        }`}>
          <p className={`text-lg font-semibold ${state.result.success ? "text-emerald-300" : "text-red-300"}`}>
            {state.result.success ? "Importazione completata!" : "Errore durante l'importazione"}
          </p>
          {state.result.success && state.result.entities && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {Object.entries(state.result.entities).filter(([, v]) => Number(v) > 0).map(([key, val]) => (
                <div key={key} className="rounded-xl bg-white/[0.03] px-3 py-2">
                  <p className="text-sm font-semibold text-veil-gold">{String(val)}</p>
                  <p className="text-[10px] text-white/30 capitalize">{key}</p>
                </div>
              ))}
            </div>
          )}
          {state.result.code && (
            <p className="mt-2 text-xs text-veil-gold/60">Codice campagna: {state.result.code}</p>
          )}
        </div>
      )}
    </div>
  );
}