"use client";

import type { GenerationResult } from "@/types";

interface ArtworkDisplayProps {
  result: GenerationResult;
}

export default function ArtworkDisplay({ result }: ArtworkDisplayProps) {
  async function handleDownload() {
    const safeTitle = result.track.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .slice(0, 40);
    const filename = `vynl_${safeTitle}_${result.style}.jpg`;
    try {
      const res = await fetch(result.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(result.imageUrl, "_blank");
    }
  }

  return (
    <div className="w-full animate-fade-in">
      {/* Artwork canvas */}
      <div className="w-full aspect-square bg-void border border-ash overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={result.imageUrl}
          alt={`${result.track.title} — ${result.style}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Interpretation */}
      {result.interpretation && (
        <div className="mt-4 border-l-2 border-ash pl-4">
          <p className="text-xs font-mono text-mist leading-relaxed">
            {result.interpretation}
          </p>
        </div>
      )}

      {/* Track meta + download */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-mono text-mist-2 truncate">
            {result.track.title}
          </div>
          <div className="text-xs font-mono text-mist truncate">
            {result.track.artist}
          </div>
          <div className="text-xs font-mono text-mist mt-0.5 uppercase tracking-wider">
            {result.style.replace(/-/g, " ")}
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-ash text-mist hover:border-mist-2 hover:text-mist-2 transition-colors shrink-0"
        >
          Download
        </button>
      </div>
    </div>
  );
}
