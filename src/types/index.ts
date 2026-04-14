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
    description: "Digital artifacts. Fractured reality. Millennium anxiety.",
    palette: ["#d4ff00", "#ff00ff", "#050505", "#1a1a2e"],
  },
  {
    id: "chrome-melancholy",
    label: "Chrome Melancholy",
    description: "Post-industrial desolation. Cold precision. Reflective silence.",
    palette: ["#c0c0c0", "#8a9bb5", "#2d3142", "#0a0a0f"],
  },
  {
    id: "distressed-editorial",
    label: "Distressed Editorial",
    description: "Risograph failure. Newsprint. Analog error as beauty.",
    palette: ["#e63946", "#4ecdc4", "#faf3dd", "#1d1d1d"],
  },
  {
    id: "cerebral-experimental",
    label: "Cerebral / Experimental",
    description: "Systems thinking made visual. Order dissolving into noise.",
    palette: ["#0a1628", "#f5e6c8", "#2c5f8a", "#ffffff"],
  },
  {
    id: "dream-wreckage",
    label: "Dream Wreckage",
    description: "Surrealist collapse. Melting forms. Beautiful ruin.",
    palette: ["#ffb347", "#7b2d8b", "#f5b8a0", "#1a0a2e"],
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
  previewUrl: string | null;
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
