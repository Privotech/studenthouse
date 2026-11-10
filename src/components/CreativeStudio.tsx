"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Paintbrush,
  Pencil,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  Pipette,
  PaintBucket,
  RotateCcw,
  RotateCw,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Sliders,
  Layers,
  History,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Check,
  ChevronDown,
} from "lucide-react";
import { AgeZone, CreativeSubmissionItem } from "@/types/naijaplay";
import { sounds } from "@/lib/audio";

interface CreativeStudioProps {
  ageZone: AgeZone;
  submissions: CreativeSubmissionItem[];
  onSubmitWork: (item: CreativeSubmissionItem) => void;
  onAwardXP: (amount: number, reason: string) => void;
}

type ToolType =
  | "brush"
  | "pencil"
  | "eraser"
  | "rect"
  | "circle"
  | "line"
  | "text"
  | "picker"
  | "fill";

const PRESET_SWATCHES = [
  "#000000",
  "#FFFFFF",
  "#059669", // Emerald Green
  "#0284C7", // Cyan Sky
  "#D97706", // Amber Ochre
  "#DC2626", // Crimson
  "#7C3AED", // Violet
  "#475569", // Slate
  "#E2E8F0", // Silver White
  "#10B981", // Bright Mint
  "#F59E0B", // Gold
  "#64748B", // Cool Gray
];

export const CreativeStudio: React.FC<CreativeStudioProps> = ({
  ageZone,
  submissions,
  onSubmitWork,
  onAwardXP,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Studio tool settings
  const [activeTool, setActiveTool] = useState<ToolType>("brush");
  const [primaryColor, setPrimaryColor] = useState<string>("#059669");
  const [brushSize, setBrushSize] = useState<number>(6);
  const [opacity, setOpacity] = useState<number>(100);
  const [isFilled, setIsFilled] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>("NaijaPlay Studio");
  const [fontSize, setFontSize] = useState<number>(24);

  // Canvas Viewport settings
  const [canvasWidth, setCanvasWidth] = useState<number>(900);
  const [canvasHeight, setCanvasHeight] = useState<number>(600);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(false);

  // Interaction State
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  // Undo / Redo History Stack
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [historyActionNames, setHistoryActionNames] = useState<string[]>([]);

  // Publish / Export modal
  const [exportTitle, setExportTitle] = useState<string>("Studio Composition 01");
  const [showPublishSuccess, setShowPublishSuccess] = useState<boolean>(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"canvas" | "gallery">("canvas");

  // Push current canvas state to history stack
  const pushState = useCallback((actionName: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistoryStack((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, dataUrl];
    });
    setHistoryActionNames((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, actionName];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Initialize blank canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const initialData = canvas.toDataURL();
    setHistoryStack([initialData]);
    setHistoryActionNames(["New Canvas"]);
    setHistoryIndex(0);
  }, []);

  // Undo
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    sounds.playClick();
    const newIdx = historyIndex - 1;
    restoreState(newIdx);
    setHistoryIndex(newIdx);
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex >= historyStack.length - 1) return;
    sounds.playClick();
    const newIdx = historyIndex + 1;
    restoreState(newIdx);
    setHistoryIndex(newIdx);
  };

  const restoreState = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dataUrl = historyStack[index];
    if (!dataUrl) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  };

  // Clear canvas
  const handleClear = () => {
    sounds.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushState("Clear Canvas");
  };

  // Image Upload handler (Import photo into canvas)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw image centered and scaled to fit
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, w, h);
        pushState(`Import: ${file.name.slice(0, 15)}`);
        sounds.playCorrect();
      };
      if (typeof event.target?.result === "string") {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Export image file (PNG / JPEG)
  const handleExport = (format: "png" | "jpeg") => {
    sounds.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mime = format === "png" ? "image/png" : "image/jpeg";
    const dataUrl = canvas.toDataURL(mime, 0.95);
    const link = document.createElement("a");
    link.download = `${exportTitle.toLowerCase().replace(/\s+/g, "-")}.${format}`;
    link.href = dataUrl;
    link.click();
    onAwardXP(50, "Studio Composition Exported");
  };

  // Publish to community gallery
  const handlePublish = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isPublishing) return;

    setIsPublishing(true);
    setPublishError(null);
    try {
      const image = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not create an image from the canvas."));
        }, "image/png");
      });
      const formData = new FormData();
      formData.append("image", image, "composition.png");
      formData.append("title", exportTitle || "Untitled Composition");

      const token = typeof window !== "undefined" ? localStorage.getItem("np_session_token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/media/creative", {
        method: "POST",
        headers,
        body: formData,
      });
      const result: unknown = await response.json();

      let submissionImageUrl = canvas.toDataURL("image/png");
      let submissionAuthor = "Scholar Architect";
      let submissionZone = ageZone;
      let submissionId = `art-${Date.now()}`;

      if (response.ok && typeof result === "object" && result !== null && "imageUrl" in result) {
        const resObj = result as { id?: string; imageUrl: string; author?: string; authorZone?: string };
        submissionImageUrl = resObj.imageUrl;
        if (resObj.author) submissionAuthor = resObj.author;
        if (resObj.authorZone) submissionZone = resObj.authorZone as AgeZone;
        if (resObj.id) submissionId = resObj.id;
      } else if (response.status === 503) {
        // Cloudinary credentials not configured in local environment; fallback gracefully to client canvas image
        submissionAuthor = "Initiate Architect";
      } else {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof (result as { error: unknown }).error === "string"
            ? (result as { error: string }).error
            : "Could not publish your composition.";
        throw new Error(message);
      }

      const newSubmission: CreativeSubmissionItem = {
        id: submissionId,
        title: exportTitle || "Untitled Composition",
        author: submissionAuthor,
        authorZone: submissionZone,
        category: "Design Composition",
        content: submissionImageUrl,
        type: "image",
        likes: 1,
        moderationStatus: "Approved",
        tags: ["DigitalArt", "Studio", "Composition"],
        createdAt: new Date().toISOString().split("T")[0]!,
      };

      sounds.playTrophy();
      onSubmitWork(newSubmission);
      onAwardXP(100, "Published Studio Design");
      setShowPublishSuccess(true);
      setTimeout(() => setShowPublishSuccess(false), 3000);
    } catch (error) {
      console.error("Creative Studio publish failed:", error);
      setPublishError(
        error instanceof Error ? error.message : "Could not publish your composition."
      );
    } finally {
      setIsPublishing(false);
    }
  };

  // Canvas Mouse Coordinates helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Canvas Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos({ x, y });

    // Save snapshot for shape previews
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    if (activeTool === "brush" || activeTool === "pencil" || activeTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = activeTool === "eraser" ? "#FFFFFF" : primaryColor;
      ctx.lineWidth = activeTool === "pencil" ? 2 : brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = opacity / 100;
    } else if (activeTool === "text") {
      ctx.fillStyle = primaryColor;
      ctx.font = `600 ${fontSize}px sans-serif`;
      ctx.globalAlpha = opacity / 100;
      ctx.fillText(textInput, x, y);
      pushState(`Text: "${textInput.slice(0, 10)}"`);
      setIsDrawing(false);
    } else if (activeTool === "picker") {
      // Eyedropper pixel reading
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0]! << 16) + (pixel[1]! << 8) + pixel[2]!).toString(16).slice(1)}`;
      setPrimaryColor(hex);
      sounds.playClick();
      setIsDrawing(false);
    } else if (activeTool === "fill") {
      // Flood Fill entire canvas or target area
      ctx.fillStyle = primaryColor;
      ctx.globalAlpha = opacity / 100;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      pushState("Fill Background");
      setIsDrawing(false);
    }
  };

  // Canvas Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    if (activeTool === "brush" || activeTool === "pencil" || activeTool === "eraser") {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (snapshot && startPos) {
      // Restore snapshot for real-time preview of shapes
      ctx.putImageData(snapshot, 0, 0);
      ctx.strokeStyle = primaryColor;
      ctx.fillStyle = primaryColor;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = opacity / 100;

      if (activeTool === "rect") {
        const width = x - startPos.x;
        const height = y - startPos.y;
        if (isFilled) {
          ctx.fillRect(startPos.x, startPos.y, width, height);
        } else {
          ctx.strokeRect(startPos.x, startPos.y, width, height);
        }
      } else if (activeTool === "circle") {
        ctx.beginPath();
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        if (isFilled) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
      } else if (activeTool === "line") {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  // Canvas Mouse Up
  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.closePath();
    ctx.globalAlpha = 1;
    pushState(`Tool: ${activeTool}`);
  };

  // Image Filter Adjustments
  const applyFilter = (filterType: "grayscale" | "invert" | "sepia" | "brightness" | "contrast" | "monochrome") => {
    sounds.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;

      if (filterType === "grayscale") {
        const avg = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      } else if (filterType === "invert") {
        data[i] = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
      } else if (filterType === "sepia") {
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      } else if (filterType === "brightness") {
        data[i] = Math.min(255, r + 25);
        data[i + 1] = Math.min(255, g + 25);
        data[i + 2] = Math.min(255, b + 25);
      } else if (filterType === "contrast") {
        const factor = (259 * (35 + 255)) / (255 * (259 - 35));
        data[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, factor * (g - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, factor * (b - 128) + 128));
      } else if (filterType === "monochrome") {
        const avg = (r + g + b) / 3;
        const v = avg > 128 ? 255 : 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    pushState(`Filter: ${filterType}`);
  };

  return (
    <div className="space-y-4">
      {/* Studio Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            <Layers className="w-4 h-4" />
            <span>NaijaPlay Studio · Professional Graphics Editor</span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
            Photoshop Web Design Studio
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("canvas");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "canvas"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Editor Workspace
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("gallery");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "gallery"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Scholarly Showcase ({submissions.length})
          </button>
        </div>
      </div>

      {activeTab === "canvas" ? (
        <div className="space-y-3">
          {/* TOP STUDIO TOOLBAR MENU */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left: Quick Actions */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Import Image from Disk"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Image</span>
              </button>

              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Clear Workspace"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <div className="h-4 w-px bg-slate-800" />

              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleRedo}
                disabled={historyIndex >= historyStack.length - 1}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-800" />

              {/* Filter Presets Dropdown */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-mono text-[11px]">Filters:</span>
                <button
                  onClick={() => applyFilter("grayscale")}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px]"
                >
                  Grayscale
                </button>
                <button
                  onClick={() => applyFilter("contrast")}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px]"
                >
                  Contrast
                </button>
                <button
                  onClick={() => applyFilter("sepia")}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px]"
                >
                  Sepia
                </button>
                <button
                  onClick={() => applyFilter("invert")}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px]"
                >
                  Invert
                </button>
              </div>
            </div>

            {/* Right: Export & Publish */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("png")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG</span>
              </button>

              <button
                onClick={() => handleExport("jpeg")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JPEG</span>
              </button>

              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60 font-bold text-white transition-colors shadow-lg shadow-emerald-950"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isPublishing ? "Uploading..." : "Publish (+100 XP)"}</span>
              </button>
            </div>
          </div>

          {/* MAIN PHOTOSHOP WORKSPACE: LEFT TOOLS | CENTER VIEWPORT | RIGHT INSPECTOR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            {/* 1. LEFT TOOLBAR (PHOTOSHOP STYLE) */}
            <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-950 p-2 flex lg:flex-col items-center justify-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveTool("brush")}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === "brush"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Brush Tool (B)"
              >
                <Paintbrush className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTool("pencil")}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === "pencil"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Pencil Tool (P)"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTool("eraser")}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === "eraser"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Eraser Tool (E)"
              >
                <Eraser className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTool("rect")}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === "rect"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Rectangle Tool (U)"
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTool("circle")}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === "circle"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Ellipse Tool (O)"
              >
                <Circle className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTool("line")}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === "line"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Line Tool (L)"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTool("text")}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === "text"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Text Tool (T)"
              >
                <Type className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTool("fill")}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === "fill"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Paint Bucket (G)"
              >
                <PaintBucket className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTool("picker")}
                className={`p-2.5 rounded-xl transition-all ${
                  activeTool === "picker"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
                title="Eyedropper Color Picker (I)"
              >
                <Pipette className="w-4 h-4" />
              </button>

              <div className="h-px w-6 bg-slate-800 my-1 hidden lg:block" />

              {/* Active Color Preview */}
              <div
                className="w-7 h-7 rounded-lg border-2 border-white/50 shadow-inner cursor-pointer"
                style={{ backgroundColor: primaryColor }}
                title={`Active Color: ${primaryColor}`}
              />
            </div>

            {/* 2. CENTER CANVAS VIEWPORT */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#070b14] p-3 flex flex-col items-center justify-center overflow-hidden">
              {/* Canvas Status / Dimensions Info */}
              <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-mono pb-2 border-b border-slate-900 mb-2">
                <div className="flex items-center gap-3">
                  <span>{canvasWidth} x {canvasHeight} px</span>
                  <span>Zoom: {zoomLevel}%</span>
                  <span className="text-emerald-400">Tool: {activeTool.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`p-1 rounded ${showGrid ? "text-emerald-400 bg-slate-900" : "text-slate-500"}`}
                    title="Toggle Alignment Grid"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Viewport */}
              <div className="w-full max-h-[580px] overflow-auto flex items-center justify-center p-2 rounded-xl bg-slate-950/60 shadow-inner">
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: "center center",
                    transition: "transform 0.1s ease",
                  }}
                  className={`relative shadow-2xl ${showGrid ? "bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]" : ""}`}
                >
                  <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="cursor-crosshair rounded border border-slate-800 bg-white"
                  />
                </div>
              </div>

              {/* Publish Banner Toast */}
              {showPublishSuccess && (
                <div className="mt-2 w-full p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-700 text-xs font-semibold text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Composition uploaded and submitted for review. (+100 XP)</span>
                </div>
              )}
              {publishError && (
                <div role="alert" className="mt-2 w-full rounded-xl border border-rose-800 bg-rose-950/70 p-2.5 text-xs font-semibold text-rose-300">
                  {publishError}
                </div>
              )}
            </div>

            {/* 3. RIGHT INSPECTOR: PROPERTIES, SWATCHES, HISTORY */}
            <div className="lg:col-span-3 space-y-3">
              {/* Properties Panel */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tool Properties</span>
                </div>

                {/* Stroke Size Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Stroke Size</span>
                    <span className="text-white font-bold">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Opacity Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Opacity</span>
                    <span className="text-white font-bold">{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Shape Fill Toggle */}
                {(activeTool === "rect" || activeTool === "circle") && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-300 font-medium">Fill Shape</span>
                    <button
                      onClick={() => setIsFilled(!isFilled)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        isFilled ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isFilled ? "Filled" : "Stroke Only"}
                    </button>
                  </div>
                )}

                {/* Text Tool Options */}
                {activeTool === "text" && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 block">Typography String</label>
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="w-full rounded bg-slate-900 border border-slate-800 p-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Font Size</span>
                        <span>{fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="72"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Swatches & Color Picker Panel */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
                  <span>Color Swatches</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span>{primaryColor.toUpperCase()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {PRESET_SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      onClick={() => setPrimaryColor(swatch)}
                      style={{ backgroundColor: swatch }}
                      className={`h-7 rounded-lg border transition-transform ${
                        primaryColor.toLowerCase() === swatch.toLowerCase()
                          ? "border-emerald-400 scale-110 shadow-lg ring-2 ring-emerald-500/50"
                          : "border-slate-800 hover:scale-105"
                      }`}
                      title={swatch}
                    />
                  ))}
                </div>
              </div>

              {/* History / Action Stack Panel */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <History className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Action History ({historyStack.length})</span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 text-xs font-mono pr-1">
                  {historyActionNames.map((action, idx) => (
                    <button
                      key={`${action}-${idx}`}
                      onClick={() => {
                        sounds.playClick();
                        restoreState(idx);
                        setHistoryIndex(idx);
                      }}
                      className={`w-full text-left px-2.5 py-1 rounded transition-colors flex items-center justify-between ${
                        idx === historyIndex
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold"
                          : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                      }`}
                    >
                      <span className="truncate">{idx + 1}. {action}</span>
                      {idx === historyIndex && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SCHOLARLY SHOWCASE GALLERY TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Scholarly & Architectural Showcase
              </h3>
              <p className="text-xs text-slate-400">
                Peer-reviewed engineering compositions, scientific diagrams, and analytical essays.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="text-emerald-400 font-bold">{item.category}</span>
                    <span>{item.createdAt}</span>
                  </div>
                  <h4 className="font-display text-base font-bold text-white">
                    {item.title}
                  </h4>
                  {item.type === "image" &&
                  (item.content.startsWith("data:image") ||
                    item.content.startsWith("https://res.cloudinary.com/")) ? (
                    <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950 max-h-48 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.content}
                        alt={item.title}
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                      {item.content}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
                  <span>Author: {item.author}</span>
                  <span className="font-mono text-emerald-400 font-bold">{item.likes} Endorsements</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
