"use client";

import { useState, useCallback } from "react";
import TrackInput from "@/components/TrackInput";
import TrackCard from "@/components/TrackCard";
import StyleSelector from "@/components/StyleSelector";
import ArtworkDisplay from "@/components/ArtworkDisplay";
import SiteNav from "@/components/SiteNav";
import type { AppState, ArtStyle, SpotifyTrack, GenerationResult } from "@/types";

// ── Generating state UI ──────────────────────────────────────────────────────

// Full-width bands — translateY gives unambiguous up/down float
const RENDER_BLOCKS = [
  { top: "5%",  h: "7%",  delay: "0s",   dur: "3.0s" },
  { top: "17%", h: "13%", delay: "0.6s", dur: "3.6s" },
  { top: "34%", h: "4%",  delay: "1.2s", dur: "2.6s" },
  { top: "42%", h: "16%", delay: "0.3s", dur: "4.0s" },
  { top: "62%", h: "6%",  delay: "0.9s", dur: "2.8s" },
  { top: "72%", h: "10%", delay: "1.5s", dur: "3.2s" },
  { top: "86%", h: "5%",  delay: "0.5s", dur: "2.4s" },
];

function GeneratingView() {
  return (
    <div className="w-full aspect-square bg-void border border-ash overflow-hidden relative">
      {/* Full-width bands floating up and down */}
      {RENDER_BLOCKS.map((b, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 bg-mist"
          style={{
            top: b.top,
            height: b.h,
            animation: `float-block ${b.dur} ease-in-out ${b.delay} infinite`,
          }}
        />
      ))}

      {/* Scan line sweeping top to bottom */}
      <div
        className="absolute left-0 right-0 h-px bg-mist-2 opacity-40"
        style={{ animation: "scan-line 2s linear infinite" }}
      />

      {/* Label */}
      <div className="absolute bottom-5 left-5">
        <span className="text-xs font-mono text-mist uppercase tracking-widest animate-pulse-slow">
          Rendering
        </span>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

interface CostInfo {
  llmProvider: string;
  llmModel: string;
  llmInputTokens: number | null;
  llmOutputTokens: number | null;
  llmCost: number | null;
  llmHost?: string;
  llmApiKeySource?: "LLM_API_KEY" | "OPENAI_API_KEY";
  falCost: number;
  falFluxModel?: string;
  falInferenceSteps?: number;
  falGuidanceScale?: number;
  falSeed?: number;
  total: number;
  costNotes?: string[];
}

export default function HomePage() {
  const [state, setState] = useState<AppState>({ phase: "idle" });
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle | null>(null);
  const [lastCost, setLastCost] = useState<CostInfo | null>(null);

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

        if (data._cost) setLastCost(data._cost);

        const result: GenerationResult = {
          imageUrl: (data.persistedImageUrl as string | undefined) ?? data.imageUrl,
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
      <SiteNav mode="home" onLogoClick={handleReset} />

      {/* Main layout */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          {/* Left: artwork area */}
          <div className="space-y-4">
            {state.phase === "done" ? (
              <>
                <ArtworkDisplay result={state.result} />
                {process.env.NODE_ENV === "development" && lastCost && (
                  <div className="border border-ash p-3 font-mono text-xs space-y-1.5">
                    <div className="text-mist-2 uppercase tracking-wider text-[10px]">dev · cost estimate</div>
                    <div className="flex justify-between text-mist">
                      <span>
                        {lastCost.llmProvider} ({lastCost.llmModel}){" "}
                        {lastCost.llmInputTokens !== null && lastCost.llmOutputTokens !== null
                          ? `(${lastCost.llmInputTokens}↑ ${lastCost.llmOutputTokens}↓ tokens)`
                          : "(usage unavailable)"}
                      </span>
                      <span>
                        {lastCost.llmCost !== null ? `$${lastCost.llmCost.toFixed(4)}` : "n/a"}
                      </span>
                    </div>
                    {(lastCost.llmHost || lastCost.llmApiKeySource) && (
                      <div className="text-mist text-[10px] leading-snug">
                        {lastCost.llmHost && (
                          <div>
                            LLM host <span className="text-bone">{lastCost.llmHost}</span>
                          </div>
                        )}
                        {lastCost.llmApiKeySource && (
                          <div>
                            API key from <span className="text-bone">{lastCost.llmApiKeySource}</span>{" "}
                            <span className="text-mist-2">(LLM_API_KEY overrides OPENAI_API_KEY)</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between text-mist">
                      <span>
                        fal.ai {lastCost.falFluxModel ?? "fal-ai/flux/schnell"}
                        {lastCost.falInferenceSteps != null
                          ? ` · ${lastCost.falInferenceSteps} steps`
                          : ""}
                        {lastCost.falGuidanceScale != null
                          ? ` · cfg ${lastCost.falGuidanceScale.toFixed(2)}`
                          : ""}
                      </span>
                      <span>${lastCost.falCost.toFixed(4)}</span>
                    </div>
                    {lastCost.falSeed != null && (
                      <div className="text-mist text-[10px]">
                        flux seed {lastCost.falSeed}
                      </div>
                    )}
                    <div className="flex justify-between text-mist-2 border-t border-ash pt-1.5">
                      <span>total</span>
                      <span>${lastCost.total.toFixed(4)}</span>
                    </div>
                    {lastCost.costNotes && lastCost.costNotes.length > 0 && (
                      <ul className="text-mist text-[10px] leading-relaxed list-disc pl-4 space-y-0.5 pt-1 border-t border-ash">
                        {lastCost.costNotes.map((note, i) => (
                          <li key={i}>{note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
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
