"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import SiteNav from "@/components/SiteNav";
import { ART_STYLES, type GalleryApiItem } from "@/types";

function styleLabel(id: string): string {
  return ART_STYLES.find((s) => s.id === id)?.label ?? id;
}

const EXPANDABLE_COLLAPSED_PX = 160;

function ExpandableSection({
  itemId,
  children,
}: {
  itemId: string;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const run = () =>
      setShowToggle(el.scrollHeight > EXPANDABLE_COLLAPSED_PX + 2);
    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    return () => ro.disconnect();
  }, [itemId]);

  return (
    <div>
      <div
        ref={innerRef}
        className={expanded ? "max-h-none" : "max-h-40 overflow-hidden"}
      >
        {children}
      </div>
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 font-mono text-[10px] uppercase tracking-widest text-mist-2 hover:text-cream border border-transparent hover:border-ash px-0 py-1 transition-colors"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}

function GalleryModal({
  item,
  onClose,
}: {
  item: GalleryApiItem;
  onClose: () => void;
}) {
  const { payload } = item;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[rgba(0,0,0,0.55)] backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`gallery-piece-${item.id}-title`}
        className="w-full max-w-lg max-h-[min(90vh,880px)] overflow-y-auto border border-ash bg-void shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-square bg-void-2 border-b border-ash">
          <Image
            src={item.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
            unoptimized
          />
        </div>
        <div className="p-6 space-y-5 font-mono text-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <ExpandableSection itemId={item.id}>
                <h2
                  id={`gallery-piece-${item.id}-title`}
                  className="text-sm text-cream uppercase tracking-wider leading-snug"
                >
                  {payload.track.title}
                </h2>
                <p className="text-mist mt-1">{payload.track.artist}</p>
              </ExpandableSection>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-mist hover:text-cream uppercase tracking-widest text-[10px] px-2 py-1 border border-ash hover:border-ash-2 transition-colors"
            >
              Close
            </button>
          </div>

          <ExpandableSection itemId={item.id}>
            <div className="space-y-1 text-mist">
              <div>
                <span className="text-mist-2 uppercase tracking-wider text-[10px]">
                  Style
                </span>
                <p className="text-cream mt-0.5">{styleLabel(payload.style)}</p>
              </div>
              <div>
                <span className="text-mist-2 uppercase tracking-wider text-[10px]">
                  Album
                </span>
                <p className="text-cream mt-0.5">
                  {payload.track.album}
                  {payload.track.releaseYear
                    ? ` · ${payload.track.releaseYear}`
                    : ""}
                </p>
              </div>
            </div>
          </ExpandableSection>

          <div>
            <div className="text-mist-2 uppercase tracking-wider text-[10px] mb-1.5">
              Interpretation
            </div>
            <ExpandableSection itemId={item.id}>
              <p className="text-mist leading-relaxed whitespace-pre-wrap">
                {payload.interpretation}
              </p>
            </ExpandableSection>
          </div>

          <div>
            <div className="text-mist-2 uppercase tracking-wider text-[10px] mb-1.5">
              Image prompt
            </div>
            <ExpandableSection itemId={item.id}>
              <p className="text-mist leading-relaxed whitespace-pre-wrap break-words">
                {payload.imagePrompt}
              </p>
            </ExpandableSection>
          </div>

          {payload.fluxPrompt && (
            <div>
              <div className="text-mist-2 uppercase tracking-wider text-[10px] mb-1.5">
                Flux prompt
              </div>
              <ExpandableSection itemId={item.id}>
                <p className="text-mist leading-relaxed whitespace-pre-wrap break-words opacity-90">
                  {payload.fluxPrompt}
                </p>
              </ExpandableSection>
            </div>
          )}

          {payload.track.spotifyUrl && (
            <a
              href={payload.track.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-mist-2 hover:text-cream underline underline-offset-2"
            >
              Open on Spotify
            </a>
          )}

          {payload.cost && (
            <div className="border-t border-ash pt-4">
              <div className="text-mist-2 uppercase tracking-wider text-[10px] mb-1.5">
                Generation snapshot
              </div>
              <ExpandableSection itemId={item.id}>
                <div className="space-y-2 text-[10px] text-mist">
                  <div className="flex justify-between gap-4">
                    <span>{payload.cost.llmModel}</span>
                    <span>
                      {payload.cost.llmCost != null
                        ? `$${payload.cost.llmCost.toFixed(4)}`
                        : "n/a"}{" "}
                      LLM
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>{payload.cost.falFluxModel ?? "fal"}</span>
                    <span>${payload.cost.falCost.toFixed(4)} fal</span>
                  </div>
                  {payload.cost.falSeed != null && (
                    <div>Seed {payload.cost.falSeed}</div>
                  )}
                </div>
              </ExpandableSection>
            </div>
          )}

          <div className="text-[10px] text-mist pt-2 border-t border-ash">
            Saved {new Date(item.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryApiItem[] | null>(null);
  const [selected, setSelected] = useState<GalleryApiItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      if (!res.ok) {
        const parts = [
          data.error ?? "Could not load gallery.",
          typeof data.details === "string" ? data.details : null,
          typeof data.hint === "string" ? data.hint : null,
        ].filter(Boolean);
        setError(parts.join(" — "));
        setItems([]);
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setError("Could not load gallery.");
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-void text-cream">
      <SiteNav mode="gallery" />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-mono text-sm uppercase tracking-[0.25em] text-cream mb-2">
            Gallery
          </h1>
          <p className="font-mono text-xs text-mist leading-relaxed">
            Every artwork you generate is kept here. Open a piece for full notes,
            prompts, and track details.
          </p>
        </div>

        {error && (
          <div className="mb-8 border border-ash p-4 font-mono text-xs text-mist">
            {error}
          </div>
        )}

        {items === null ? (
          <div className="font-mono text-xs text-mist animate-pulse-slow">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="border border-ash border-dashed p-12 text-center space-y-4">
            <p className="font-mono text-xs text-mist">
              No pieces yet. Generate something first.
            </p>
            <Link
              href="/"
              className="inline-block font-mono text-xs uppercase tracking-widest text-cream border border-ash px-4 py-2 hover:border-ash-2 transition-colors"
            >
              Back to Generate
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 list-none p-0 m-0">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="w-full text-left group"
                >
                  <div className="relative w-full aspect-square bg-void-2 border border-ash overflow-hidden transition-colors group-hover:border-ash-2">
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      unoptimized
                    />
                  </div>
                  <div className="mt-3 font-mono text-[11px] text-mist uppercase tracking-wider truncate">
                    <span className="text-mist-2">{item.payload.track.title}</span>
                    <span className="text-mist mx-1">·</span>
                    <span>{styleLabel(item.payload.style)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {selected && (
        <GalleryModal
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
