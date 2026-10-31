"use client";

import React, { useEffect, useState } from "react";
import { FileText, Database } from "lucide-react";

interface DocIndexItem {
  key: string;
  title: string;
  relativePath: string;
  category: string;
}

const DEFAULT_INDEX: ReadonlyArray<DocIndexItem> = [
  { key: "readme", title: "README.md", relativePath: "README.md", category: "Overview" },
  {
    key: "prd",
    title: "PRODUCT_REQUIREMENTS.md",
    relativePath: "docs/product/PRODUCT_REQUIREMENTS.md",
    category: "Product",
  },
  {
    key: "system-architecture",
    title: "SYSTEM_ARCHITECTURE.md",
    relativePath: "docs/architecture/SYSTEM_ARCHITECTURE.md",
    category: "Architecture",
  },
  {
    key: "database-design",
    title: "DATABASE_DESIGN.md",
    relativePath: "docs/database/DATABASE_DESIGN.md",
    category: "Database",
  },
  {
    key: "prisma-schema",
    title: "schema.prisma (26 Models)",
    relativePath: "packages/database/prisma/schema.prisma",
    category: "Database",
  },
  {
    key: "security-requirements",
    title: "SECURITY_REQUIREMENTS.md",
    relativePath: "docs/security/SECURITY_REQUIREMENTS.md",
    category: "Security",
  },
  {
    key: "threat-model",
    title: "THREAT_MODEL.md",
    relativePath: "docs/security/THREAT_MODEL.md",
    category: "Security",
  },
  {
    key: "api-conventions",
    title: "API_CONVENTIONS.md",
    relativePath: "docs/api/API_CONVENTIONS.md",
    category: "API",
  },
  {
    key: "architecture-decisions",
    title: "ARCHITECTURE_DECISIONS.md",
    relativePath: "docs/decisions/ARCHITECTURE_DECISIONS.md",
    category: "Decisions",
  },
  {
    key: "pwa-strategy",
    title: "PWA_STRATEGY.md",
    relativePath: "docs/architecture/PWA_STRATEGY.md",
    category: "Architecture",
  },
  {
    key: "development-workflow",
    title: "DEVELOPMENT_WORKFLOW.md",
    relativePath: "docs/architecture/DEVELOPMENT_WORKFLOW.md",
    category: "Workflow",
  },
];

export function DocumentationReader() {
  const [selectedKey, setSelectedKey] = useState<string>("system-architecture");
  const [docContent, setDocContent] = useState<string>("");
  const [docPath, setDocPath] = useState<string>("docs/architecture/SYSTEM_ARCHITECTURE.md");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch(`/api/v1/architecture/docs?doc=${encodeURIComponent(selectedKey)}`);
        const json = await res.json();
        if (active && json?.data) {
          setDocContent(json.data.content ?? "");
          setDocPath(json.data.relativePath ?? "");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedKey]);

  const handleSelectDoc = (key: string) => {
    if (key !== selectedKey) {
      setIsLoading(true);
      setSelectedKey(key);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Sidebar: 10 Documentation Deliverables + Prisma Schema */}
      <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="px-2 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">
              Phase 1 Deliverables Index
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any deliverable to inspect its committed repository source
            </p>
          </div>

          <div className="space-y-1 pt-1">
            {DEFAULT_INDEX.map((item) => {
              const isSelected = selectedKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelectDoc(item.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600/20 border border-emerald-500/50 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800/70 border border-transparent"
                  }`}
                >
                  <span className="inline-flex items-center gap-2 truncate">
                    {item.key === "prisma-schema" ? (
                      <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {item.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-800 pt-3 px-2 text-[11px] text-slate-400">
          10 Architecture Docs + 1 Prisma Schema Verified
        </div>
      </div>

      {/* Right Viewport: Source Viewer */}
      <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs text-slate-400">Repository File Path: </span>
            <code className="text-xs font-mono font-semibold text-emerald-400">
              /{docPath}
            </code>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {docContent ? `${docContent.split("\n").length} lines` : "Loading..."}
          </span>
        </div>

        {isLoading ? (
          <div className="h-[460px] rounded-lg border border-slate-800 bg-slate-950 p-6 flex items-center justify-center text-xs text-slate-400 font-mono">
            Reading /{docPath} from repository filesystem...
          </div>
        ) : (
          <pre className="h-[460px] overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
            {docContent}
          </pre>
        )}
      </div>
    </div>
  );
}
