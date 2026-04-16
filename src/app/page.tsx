"use client";

import { useState, useCallback } from "react";
import TrackInput from "@/components/TrackInput";
import TrackCard from "@/components/TrackCard";
import StyleSelector from "@/components/StyleSelector";
import ArtworkDisplay from "@/components/ArtworkDisplay";
import ThemeToggle from "@/components/ThemeToggle";
import type { AppState, ArtStyle, SpotifyTrack, GenerationResult } from "@/types";

// ── Generating state UI ──────────────────────────────────────────────────────

function GeneratingView() {
  return (
    <div className="w-full aspect-square bg-void border border-ash flex flex-col items-center justify-center gap-6">
      <div className="space-y-1 w-48">
        {[100, 70, 85, 55, 90].map((w, i) => (
          <div
            key={i}
            className="h-px bg-ash-2 animate-pulse-slow"
            style={{
              width: `${w}%`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <div className="text-xs font-mono text-mist uppercase tracking-widest">
        Rendering
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [state, setState] = useState<AppState>({ phase: "idle" });
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle | null>(null);

  // ── Extract track ──────────────────────────────────────────────────────────

  const handleExtract = useCallback(async (url: string) => {
    setState({ phase: "extracting" });

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ phase: "error", message: data.error ?? "Extraction failed." });
        return;
      }

      setState({ phase: "extracted", track: data.track });
    } catch {
      setState({ phase: "error", message: "Network error. Check your connection." });
    }
  }, []);

  // ── Generate artwork ───────────────────────────────────────────────────────

  const handleGenerate = useCallback(
    async (track: SpotifyTrack, style: ArtStyle) => {
      setState({ phase: "generating", track, style });

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track, style }),
        });

        const data = await res.json();

        if (!res.ok) {
          setState({ phase: "error", message: data.error ?? "Generation failed." });
          return;
        }

        const result: GenerationResult = {
          imageUrl: data.imageUrl,
          interpretation: data.interpretation ?? "",
          style,
          track,
        };

        setState({ phase: "done", result });
      } catch {
        setState({ phase: "error", message: "Generation failed. Please try again." });
      }
    },
    []
  );

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setState({ phase: "idle" });
    setSelectedStyle(null);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const currentTrack =
    state.phase === "extracted" ||
    state.phase === "generating" ||
    state.phase === "done"
      ? state.phase === "done"
        ? state.result.track
        : (state as { track: SpotifyTrack }).track
      : null;

  const isExtracting = state.phase === "extracting";
  const isGenerating = state.phase === "generating";
  const canGenerate =
    (state.phase === "extracted" || state.phase === "done") &&
    selectedStyle !== null &&
    !isGenerating;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-void text-cream">
      {/* Header */}
      <header className="border-b border-ash px-6 py-4 flex items-center justify-between">
        <button
          onClick={handleReset}
          className="font-mono text-sm uppercase tracking-[0.3em] text-cream hover:text-bone transition-colors"
        >
          VYNL
        </button>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-mist">
            music → visual art
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          {/* Left: artwork area */}
          <div className="space-y-4">
            {state.phase === "done" ? (
              <ArtworkDisplay result={state.result} />
            ) : state.phase === "generating" ? (
              <GeneratingView />
            ) : (
              /* Placeholder canvas */
              <div className="w-full aspect-square bg-void-2 border border-ash flex items-center justify-center">
                <div className="text-center space-y-3 px-8">
                  <div className="font-mono text-xs text-mist uppercase tracking-widest">
                    Every song has a visual identity
                  </div>
                  <div className="font-mono text-xs text-mist">
                    Paste a Spotify URL to begin
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: controls panel */}
          <div className="space-y-6">
            {/* Track input */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-mist uppercase tracking-widest">
                Track
              </div>
              <TrackInput onExtract={handleExtract} isLoading={isExtracting} />
            </div>

            {/* Track card */}
            {currentTrack && (
              <div className="animate-fade-in">
                <TrackCard track={currentTrack} />
              </div>
            )}

            {/* Style selector */}
            {(state.phase === "extracted" ||
              state.phase === "generating" ||
              state.phase === "done") && (
              <div className="animate-fade-in">
                <StyleSelector
                  selected={selectedStyle}
                  onSelect={setSelectedStyle}
                  disabled={isGenerating}
                />
              </div>
            )}

            {/* Generate button */}
            {(state.phase === "extracted" || state.phase === "done") && (
              <button
                onClick={() =>
                  canGenerate && currentTrack &&
                  handleGenerate(currentTrack, selectedStyle!)
                }
                disabled={!canGenerate}
                className="
                  w-full py-3.5 font-mono text-sm uppercase tracking-widest
                  bg-cream text-void
                  hover:bg-bone
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {selectedStyle ? "Generate" : "Select a style"}
              </button>
            )}

            {/* Error */}
            {state.phase === "error" && (
              <div className="animate-fade-in border border-ash p-4">
                <div className="text-xs font-mono text-mist-2 mb-2 uppercase tracking-wider">
                  Error
                </div>
                <p className="text-xs font-mono text-mist leading-relaxed">
                  {state.message}
                </p>
                <button
                  onClick={handleReset}
                  className="mt-3 text-xs font-mono text-ash-2 hover:text-mist underline"
                >
                  Start over
                </button>
              </div>
            )}

            {/* Generating indicator in sidebar */}
            {state.phase === "generating" && (
              <div className="text-xs font-mono text-mist animate-pulse-slow">
                Generating{" "}
                <span className="text-mist-2">
                  {(state as { style: ArtStyle }).style.replace(/-/g, " ")}
                </span>
                …
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
