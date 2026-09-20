import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wine: { DEFAULT: "#5C0F2B", deep: "#420A1F", soft: "#7A2442" },
        zari: { DEFAULT: "#B4884A", light: "#D9BC87", pale: "#F1E4CC" },
        blush: { DEFAULT: "#E9B8B4", pale: "#F8E7E4" },
        ivory: { DEFAULT: "#FBF6F2", deep: "#F3EAE2" },
        ink: { DEFAULT: "#2A1B20", soft: "#5E4B52", mute: "#8C7A80" },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Jost", "system-ui", "sans-serif"],
      },
      maxWidth: { page: "80rem" },
    },
  },
  plugins: [],
} satisfies Config;
