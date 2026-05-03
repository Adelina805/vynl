import assert from "node:assert/strict";
import test from "node:test";
import {
  assessImagePromptQuality,
  assessInterpretationQuality,
  mergeQualityResults,
} from "./artDirectionQuality.ts";
import type { SpotifyTrack } from "@/types";

const dummyTrack = (): SpotifyTrack => ({
  id: "tid",
  title: "Neon Corridor",
  artist: "Nova Echo",
  album: "Static Bloom",
  releaseYear: "2023",
  popularity: 40,
  explicit: false,
  albumArt: null,
  spotifyUrl: "https://example.com/track",
  artistGenres: ["electronica"],
  audioFeatures: {
    energy: 0.5,
    valence: 0.5,
    tempo: 118,
    danceability: 0.5,
    acousticness: 0.22,
    instrumentalness: 0.08,
  },
});

const goodImagePrompt = `shard_lattice, void_band, acid_magenta (#ff00dd) dominant half_canvas, cyber_cyan (#00ffcc) accent_sliver, crude_black_outlines_diagonal_mass_upper_left, lower_right_open_breathing_field, halftone_cluster_off_axis_strip, pixel_corruption_edge_ticks, staggered_vertical_bars_gap_variation, edge_shrapnel_upper_corner, jitter_tick_strip, bleed_off_canvas_bleed_tick

The emotional arc compresses tightly into the verses then sprays open into the refrain's wide lift. Rhythm becomes geometry through jittered bars that refuse even spacing until the halftime breakdown steadies them. Geometry locks the halftone cluster to a solitary strip skewed off-grid. Outline weight snaps thick on rupture fronts, hairline elsewhere. Versus another big-room rave hit we'd widen voids symmetrically rather than pinning mass to just one rake of shards.`;

test("rejects generic filler", () => {
  const r = assessImagePromptQuality(
    "ethereal beautiful abstract with vibrant energy and dynamic composition, #112233"
  );
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("ethereal") || x.includes("filler")));
});

test("rejects prose-only first line", () => {
  const r = assessImagePromptQuality(
    "This is a stunning piece with powerful mood.\nEmotional arc. Rhythm. Geometry. Versus another hit we'd widen voids symmetrically.\n#aabbcc #ddeeff"
  );
  assert.equal(r.ok, false);
});

test("rejects keyword-only blob without prose split", () => {
  const r = assessImagePromptQuality(`a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,#aabbcc emotional arc rhythm geometry`);
  assert.equal(r.ok, false);
});

test("accepts concrete song-tied prompt + contrast clause", () => {
  const r = assessImagePromptQuality(goodImagePrompt);
  assert.equal(r.ok, true, r.reasons.join("; "));
});

test("interpretation must ground title artist and sonic fact", () => {
  const goodInterp =
    "\"Neon Corridor\" by Nova Echo on Static Bloom (2023) hinges on chorus lift at the two-minute swell. Tape-echo tails smear percussion into the refrain so the chorus feels twice as loud as the verses. Drum programming keeps a quantized four-on-the-floor backbone through the verses before opening the halftime pocket for the breakdown.";
  const rGood = assessInterpretationQuality(goodInterp, dummyTrack());
  assert.equal(rGood.ok, true, rGood.reasons.join("; "));

  const bad = mergeQualityResults(
    assessInterpretationQuality("Vibes are sad and ethereal soundscape.", dummyTrack()),
    assessImagePromptQuality(goodImagePrompt)
  );
  assert.equal(bad.ok, false);
});
