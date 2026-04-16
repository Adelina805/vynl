export type ArtStyle =
  | "grunge-y2k"
  | "chrome-melancholy"
  | "distressed-editorial"
  | "cerebral-experimental"
  | "dream-wreckage";

export interface ArtStyleMeta {
  id: ArtStyle;
  label: string;
  description: string;
  palette: string[];
}

export const ART_STYLES: ArtStyleMeta[] = [
  {
    id: "grunge-y2k",
    label: "Grunge Y2K",
    description: "Digital rot. Chromatic corruption. The internet before it was clean.",
    palette: ["#d4ff00", "#ff00dd", "#00ffcc", "#0a0a0a"],
  },
  {
    id: "chrome-melancholy",
    label: "Chrome Melancholy",
    description: "Industrial stillness. Cold surfaces holding grief.",
    palette: ["#dde4ea", "#6a8fa8", "#1c2535", "#06080e"],
  },
  {
    id: "distressed-editorial",
    label: "Distressed Editorial",
    description: "Misregistered ink. Newsprint heat. Analog failure as truth.",
    palette: ["#e63946", "#0ea59e", "#f5f0e2", "#1a1510"],
  },
  {
    id: "cerebral-experimental",
    label: "Cerebral / Experimental",
    description: "Geometric systems at the moment they collapse.",
    palette: ["#060e1e", "#f0e6cc", "#8b3a2a", "#e8e4de"],
  },
  {
    id: "dream-wreckage",
    label: "Dream Wreckage",
    description: "Post-dream debris. Colour bleeding into ruin.",
    palette: ["#ff8c42", "#6b2468", "#f0b896", "#0e0818"],
  },
];

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  releaseYear: string;
  popularity: number;
  explicit: boolean;
  albumArt: string | null;
  spotifyUrl: string;
  audioFeatures: AudioFeatures | null;
}

export interface AudioFeatures {
  energy: number;
  valence: number;
  tempo: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
}

export interface GenerationResult {
  imageUrl: string;
  interpretation: string;
  style: ArtStyle;
  track: SpotifyTrack;
}

export type AppState =
  | { phase: "idle" }
  | { phase: "extracting" }
  | { phase: "extracted"; track: SpotifyTrack }
  | { phase: "generating"; track: SpotifyTrack; style: ArtStyle }
  | { phase: "done"; result: GenerationResult }
  | { phase: "error"; message: string };
