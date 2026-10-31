"use client";

import React, { useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        Install PWA
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Smartphone className="w-3.5 h-3.5" />
        {isIOS ? "Install on iOS" : "PWA Spec"}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 id="pwa-modal-title" className="text-base font-semibold text-white">
                NaijaPlay Mobile-First PWA Installation
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>
                NaijaPlay is configured with a Web App Manifest (<code className="font-mono text-xs text-emerald-400">/manifest.webmanifest</code>), standalone display mode, and strict child-safe cache rules.
              </p>
              {isIOS ? (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-xs space-y-1.5">
                  <p className="font-semibold text-white">Install on iPhone / iPad (Safari):</p>
                  <p>1. Tap the <strong>Share</strong> button in the Safari toolbar.</p>
                  <p>2. Select <strong>Add to Home Screen</strong>.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 text-xs space-y-1.5">
                  <p className="font-semibold text-white">Install on Android / Desktop Chromium:</p>
                  <p>1. Open the browser address bar or menu.</p>
                  <p>2. Select <strong>Install NaijaPlay</strong> or <strong>Add to Home screen</strong>.</p>
                  <p className="text-slate-400 pt-1">
                    Security Note: Private child profiles and guardian consent records use <code className="font-mono text-emerald-400">Cache-Control: no-store</code> and are never written to shared public caches.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
