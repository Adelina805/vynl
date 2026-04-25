"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

type SiteNavProps =
  | { mode: "home"; onLogoClick: () => void }
  | { mode: "gallery" };

export default function SiteNav(props: SiteNavProps) {
  return (
    <header className="border-b border-ash px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-6 min-w-0">
        {props.mode === "home" ? (
          <button
            type="button"
            onClick={props.onLogoClick}
            className="font-mono text-sm uppercase tracking-[0.3em] text-cream hover:text-bone transition-colors shrink-0"
          >
            VYNL
          </button>
        ) : (
          <Link
            href="/"
            className="font-mono text-sm uppercase tracking-[0.3em] text-cream hover:text-bone transition-colors shrink-0"
          >
            VYNL
          </Link>
        )}
        {props.mode === "home" ? (
          <Link
            href="/gallery"
            className="font-mono text-xs uppercase tracking-widest text-mist hover:text-mist-2 transition-colors whitespace-nowrap"
          >
            Gallery
          </Link>
        ) : (
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-widest text-mist hover:text-mist-2 transition-colors whitespace-nowrap"
          >
            Generate
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-xs text-mist hidden sm:inline">
          music → visual art
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
