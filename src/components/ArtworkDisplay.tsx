"use client";

import { useRef } from "react";
import type { GenerationResult } from "@/types";

interface ArtworkDisplayProps {
  result: GenerationResult;
  onRegenerate: () => void;
  onReset: () => void;
}

export default function ArtworkDisplay({
  result,
  onRegenerate,
  onReset,
}: ArtworkDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleDownload() {
    const blob = new Blob([result.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = result.track.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .slice(0, 40);
    a.href = url;
    a.download = `vynl_${safeTitle}_${result.style}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full animate-fade-in">
      {/* Artwork canvas */}
      <div
        ref={containerRef}
        className="w-full aspect-square bg-void border border-ash overflow-hidden"
        dangerouslySetInnerHTML={{ __html: result.svg }}
      />

      {/* Interpretation */}
      {result.interpretation && (
        <div className="mt-4 border-l-2 border-ash pl-4">
          <p className="text-xs font-mono text-mist leading-relaxed">
            {result.interpretation}
          </p>
        </div>
      )}

      {/* Track meta + actions */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-mono text-mist-2 truncate">
            {result.track.title}
          </div>
          <div className="text-xs font-mono text-mist truncate">
            {result.track.artist}
          </div>
          <div className="text-xs font-mono text-ash-2 mt-0.5 uppercase tracking-wider">
            {result.style.replace(/-/g, " ")}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-ash text-mist hover:border-mist-2 hover:text-mist-2 transition-colors"
          >
            .svg
          </button>
          <button
            onClick={onRegenerate}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-ash text-mist hover:border-mist-2 hover:text-mist-2 transition-colors"
          >
            Regen
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-ash text-mist hover:border-mist-2 hover:text-mist-2 transition-colors"
          >
            New
          </button>
        </div>
      </div>
    </div>
  );
}
