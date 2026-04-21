import { getStyleGuidance } from "@/lib/prompts";
import type {
  ArtDirectionProvider,
  GenerateArtDirectionInput,
  GenerateArtDirectionOutput,
} from "@/lib/llm/types";

function describeEnergy(value: number): string {
  if (value > 0.75) return "explosive";
  if (value > 0.5) return "charged";
  if (value > 0.3) return "steady";
  return "subdued";
}

function describeValence(value: number): string {
  if (value > 0.7) return "euphoric";
  if (value > 0.5) return "warm";
  if (value > 0.3) return "ambiguous";
  return "somber";
}

export class TemplateArtDirectionProvider implements ArtDirectionProvider {
  async generate({
    track,
    style,
  }: GenerateArtDirectionInput): Promise<GenerateArtDirectionOutput> {
    const styleGuidance = getStyleGuidance(style);
    const audio = track.audioFeatures;
    const energyWord = audio ? describeEnergy(audio.energy) : "textural";
    const valenceWord = audio ? describeValence(audio.valence) : "ambiguous";
    const tempo = audio ? `${audio.tempo.toFixed(0)} BPM` : "unfixed tempo";

    const interpretation = `${track.title} by ${track.artist} carries a ${energyWord} pulse with a ${valenceWord} center, balancing momentum against restraint. The arrangement feels anchored in ${track.album}${track.releaseYear ? ` (${track.releaseYear})` : ""}, where each section pushes tension forward without losing emotional clarity. This visual direction should preserve that push-pull so the image feels specific to this track's identity.`;

    const imagePrompt = `Flat 2D abstract composition for "${track.title}" by ${track.artist}. ${styleGuidance.grammar} Build dominant forms that express ${energyWord} movement at ${tempo}, with spatial pacing tied to the song's emotional arc and no representational objects. Use bold, crude outlines to separate color zones, lean into asymmetric balance, and keep contrast focused on the track's emotional peaks. Entire scene must remain single-plane graphic design with no depth, no perspective, no photography, and no text. MEDIUM: ${styleGuidance.medium}`;

    return {
      direction: { interpretation, imagePrompt },
      usage: {
        provider: "template",
        model: "template-v1",
      },
    };
  }
}
