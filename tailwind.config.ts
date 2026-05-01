import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0B",
        surface: "#1A1A1D",
        text: "#F5F5F5",
        muted: "#9CA3AF",
        accent: "#00E0FF",
        bull: "#10B981",
        warn: "#F59E0B",
        bear: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      maxWidth: {
        page: "720px",
      },
    },
  },
  plugins: [],
};

export default config;
