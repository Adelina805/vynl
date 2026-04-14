"use client";

import { useRef, useEffect, useState } from "react";
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const previewUrl = result.track.previewUrl;

  useEffect(() => {
    if (!previewUrl || audioError) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.6;
    audio.play().then(() => setPlaying(true)).catch(() => setAudioError(true));
    return () => { audio.pause(); };
  }, [previewUrl, audioError]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setAudioError(true));
    }
  }

  function handleDownload() {
    const a = document.createElement("a");
    const safeTitle = result.track.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .slice(0, 40);
    a.href = result.imageUrl;
    a.download = `vynl_${safeTitle}_${result.style}.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
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

      {/* Audio preview */}
      {previewUrl && !audioError && (
        <div className="mt-4 flex items-center gap-3">
          <audio
            ref={audioRef}
            src={previewUrl}
            loop={false}
            onEnded={() => setPlaying(false)}
            onError={() => setAudioError(true)}
          />
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause preview" : "Play preview"}
            className="flex items-center justify-center w-7 h-7 border border-ash text-mist hover:border-mist-2 hover:text-mist-2 transition-colors shrink-0"
          >
            {playing ? (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                <rect x="0" y="0" width="3" height="12" />
                <rect x="7" y="0" width="3" height="12" />
              </svg>
            ) : (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                <polygon points="0,0 10,6 0,12" />
              </svg>
            )}
          </button>
          <span className="text-xs font-mono text-ash-2 uppercase tracking-wider">
            {playing ? "preview" : "30s preview"}
          </span>
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
            .jpg
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
