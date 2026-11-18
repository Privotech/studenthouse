"use client";

import { useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

const CHUNK_RETRY_STORAGE_KEY = "np_chunk_retry_attempted";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    error.name === "ChunkLoadError" ||
    /Loading chunk .* failed|ChunkLoadError/i.test(error.message);

  useEffect(() => {
    if (!isChunkError || typeof window === "undefined") return;
    try {
      const alreadyRetried = window.sessionStorage.getItem(CHUNK_RETRY_STORAGE_KEY);
      if (!alreadyRetried) {
        window.sessionStorage.setItem(CHUNK_RETRY_STORAGE_KEY, "1");
        window.location.reload();
      }
    } catch {
      // Ignore storage restriction errors
    }
  }, [isChunkError]);

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-display text-lg font-bold text-white">
          {isChunkError ? "Refreshing Updated App Module" : "Unexpected Application Error"}
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {isChunkError
            ? "A page script took too long to load or was refreshed on the server. Reload to fetch the latest bundle."
            : "Something went wrong while rendering this view. Try reloading or resetting the view."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                try {
                  window.sessionStorage.removeItem(CHUNK_RETRY_STORAGE_KEY);
                } catch {}
                window.location.reload();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload App</span>
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
