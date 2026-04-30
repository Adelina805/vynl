import assert from "node:assert/strict";
import test from "node:test";
import { assessImagePromptQuality } from "./artDirectionQuality.ts";

const goodPrompt = `shard_lattice, void_band, acid_magenta (#ff00dd) dominant half_canvas, cyber_cyan (#00ffcc) accent sliver, crude_black outlines, diagonal_mass_upper_left, lower_right_breath, pixel_corruption_edge_ticks, flat_fill, off_axis_strip, halftone_cluster pinned, chromatic_stub, grid_underlay
The emotional arc starts compressed then releases into open field. Rhythm becomes geometry through staggered vertical stacks and a late rupture in the lower fifth. Edge weight is heavy on rupture lines; the rest stays thin and dry.`;

test("rejects generic filler", () => {
  const r = assessImagePromptQuality(
    "ethereal beautiful abstract with vibrant energy and dynamic composition, #112233"
  );
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some((x) => x.includes("ethereal") || x.includes("filler")));
});

test("rejects prose-only first line", () => {
  const r = assessImagePromptQuality(
    "This is a stunning piece with powerful mood. emotional arc. rhythm. geometry. #aabbcc #ddeeff"
  );
  assert.equal(r.ok, false);
});

test("accepts concrete song-tied prompt", () => {
  const r = assessImagePromptQuality(goodPrompt);
  assert.equal(r.ok, true, r.reasons.join("; "));
});
