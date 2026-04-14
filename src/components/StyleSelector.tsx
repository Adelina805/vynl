"use client";

import { ART_STYLES, type ArtStyle } from "@/types";

interface StyleSelectorProps {
  selected: ArtStyle | null;
  onSelect: (style: ArtStyle) => void;
  disabled?: boolean;
}

export default function StyleSelector({
  selected,
  onSelect,
  disabled,
}: StyleSelectorProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-mono text-mist uppercase tracking-widest mb-3">
        Art Direction
      </div>
      <div className="grid grid-cols-1 gap-1">
        {ART_STYLES.map((style) => {
          const isSelected = selected === style.id;
          return (
            <button
              key={style.id}
              onClick={() => onSelect(style.id)}
              disabled={disabled}
              className={`
                w-full text-left px-3 py-2.5 border transition-all
                font-mono text-xs
                disabled:cursor-not-allowed disabled:opacity-40
                ${
                  isSelected
                    ? "border-cream bg-void-3 text-cream"
                    : "border-ash bg-transparent text-mist hover:border-ash-2 hover:text-mist-2"
                }
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className={`font-mono uppercase tracking-wider text-xs ${isSelected ? "text-cream" : "text-mist-2"}`}
                  >
                    {style.label}
                  </div>
                  <div className="text-xs text-mist mt-0.5 font-mono">
                    {style.description}
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0 mt-0.5">
                  {style.palette.map((color, i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 border border-ash-2"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
