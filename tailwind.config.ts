import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // All semantic colors are CSS variables — theme switching happens in globals.css
        void:     "var(--color-void)",
        "void-2": "var(--color-void-2)",
        "void-3": "var(--color-void-3)",
        ash:      "var(--color-ash)",
        "ash-2":  "var(--color-ash-2)",
        mist:     "var(--color-mist)",
        "mist-2": "var(--color-mist-2)",
        bone:     "var(--color-bone)",
        cream:    "var(--color-cream)",
        // Fixed accent colors — don't shift with theme (used in palette swatches)
        acid:   "#d4ff00",
        chrome: "#c0c0c0",
        bruise: "#7b2d8b",
        amber:  "#ffb347",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan":       "scan 2s linear infinite",
        "fade-in":    "fadeIn 0.4s ease-out forwards",
      },
      keyframes: {
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
