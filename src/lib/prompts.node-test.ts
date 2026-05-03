import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFluxImagePrompt,
  getStyleGuidance,
  sonicFluxKeywords,
  splitFluxImagePromptLines,
  splitImagePromptDenseAndProse,
} from "./prompts.ts";
import type { ArtStyle, SpotifyTrack } from "@/types";

function mockTrack(): SpotifyTrack {
  return {
    id: "deadbeef",
    title: "Test Track",
    artist: "Artist One",
    album: "Album",
    releaseYear: "2024",
    popularity: 50,
    explicit: false,
    albumArt: null,
    spotifyUrl: "https://example.com/track",
    artistGenres: ["alternative rock", "indie rock"],
    audioFeatures: {
      energy: 0.71,
      valence: 0.4,
      tempo: 128,
      danceability: 0.62,
      acousticness: 0.08,
      instrumentalness: 0.03,
      speechiness: 0.06,
      liveness: 0.12,
      key: 5,
      mode: 1,
      timeSignature: 4,
      loudness: -6.2,
    },
  };
}

test("sonicFluxKeywords includes numeric token band and coarse tags", () => {
  const s = sonicFluxKeywords(mockTrack());
  assert.ok(s?.includes("sonic_e0.71"), s ?? "");
  assert.ok(s?.includes("_bps128"), s ?? "");
  assert.ok(s?.includes("spotifygenre_"), s ?? "");
});

test("Flux prompt uses fingerprint not full t2iAnchors passage", () => {
  const style: ArtStyle = "grunge-y2k";
  const anchors = getStyleGuidance(style).t2iAnchors;
  const fingerprint = getStyleGuidance(style).fluxFingerprint;
  assert.ok(!fingerprint.includes("hexagonal"), "keep fingerprint compact");
  const prompt = buildFluxImagePrompt(
    style,
    mockTrack(),
    "cyan shard, magenta sliver (#ff00dd dominant), void black (#0a0a0a).\nRhythm snaps into stacked bars; emotional arc punches then relaxes geometry to the heel; geometric halftone kisses one strip only. Versus another pop hit we'd lose the asymmetric heel bleed."
  );
  assert.ok(prompt.includes(fingerprint.trim().slice(0, 26)));
  assert.ok(!prompt.includes(anchors.slice(16, 40)), "anchors sentence should stay out");
  assert.ok(prompt.split(".").some((p) => p.includes("#ff00dd")));
});

test("period-space split derives prose when newline omitted", () => {
  const dense =
    "a,b,c,d,e,f,g,h,i,j,k,hex,#aabbcc,dominant,#ccddee,accent,void,zigzag,overlap,skew";
  const full = `${dense}. The emotional arc bends late. Rhythm becomes geometry through stagger strips. Compared to another hypothetical hit we'd mirror mass symmetrically rather than pinning strip bias.`;
  const { proseAfter, usedNewlineBetween } = splitImagePromptDenseAndProse(full);
  assert.equal(usedNewlineBetween, false);
  assert.ok(proseAfter.includes("emotion"));
});
