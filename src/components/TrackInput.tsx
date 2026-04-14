"use client";

import { useState } from "react";

interface TrackInputProps {
  onExtract: (url: string) => void;
  isLoading: boolean;
}

export default function TrackInput({ onExtract, isLoading }: TrackInputProps) {
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) onExtract(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a Spotify track URL…"
          disabled={isLoading}
          className="
            flex-1 min-w-0
            bg-void-3 border border-ash text-cream placeholder-mist
            px-4 py-3 text-sm font-mono
            focus:outline-none focus:border-mist
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors
          "
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="
            px-5 py-3 text-sm font-mono uppercase tracking-widest
            bg-cream text-void
            hover:bg-bone
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors whitespace-nowrap
          "
        >
          {isLoading ? "…" : "Extract"}
        </button>
      </div>
    </form>
  );
}
