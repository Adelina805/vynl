"use client";

import Image from "next/image";
import type { SpotifyTrack } from "@/types";

interface TrackCardProps {
  track: SpotifyTrack;
}

function AudioBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-mist w-16 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-ash-2 relative">
        <div
          className="absolute left-0 top-0 h-full bg-mist-2 transition-all duration-700"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-mist w-8 text-right">
        {Math.round(value * 100)}
      </span>
    </div>
  );
}

export default function TrackCard({ track }: TrackCardProps) {
  return (
    <div className="flex gap-4 animate-fade-in">
      {track.albumArt && (
        <div className="shrink-0">
          <Image
            src={track.albumArt}
            alt={`${track.album} cover`}
            width={80}
            height={80}
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <a
          href={track.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <div className="font-mono text-cream text-sm leading-tight truncate group-hover:text-bone transition-colors">
            {track.title}
          </div>
          <div className="font-mono text-mist text-xs mt-0.5 truncate">
            {track.artist}
          </div>
          <div className="font-mono text-mist text-xs mt-0.5 truncate">
            {track.album}
            {track.releaseYear && (
              <span className="ml-2">({track.releaseYear})</span>
            )}
          </div>
        </a>

        {track.audioFeatures && (
          <div className="mt-3 space-y-1">
            <AudioBar label="energy" value={track.audioFeatures.energy} />
            <AudioBar label="valence" value={track.audioFeatures.valence} />
            <AudioBar
              label="dance"
              value={track.audioFeatures.danceability}
            />
          </div>
        )}
      </div>
    </div>
  );
}
