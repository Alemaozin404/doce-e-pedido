import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FDF9F4",
          dark: "#F7F0E6",
        },
        rose: {
          soft: "#F5D5D8",
          DEFAULT: "#E8B4BC",
          dark: "#D98E9C",
          deep: "#C47585",
        },
        chocolate: {
          light: "#8A6650",
          DEFAULT: "#5C4033",
          dark: "#3E2B23",
          deepest: "#2A1D18",
        },
        gold: {
          soft: "#E9D9B8",
          DEFAULT: "#C9A96A",
          dark: "#A9884D",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 16px rgba(92, 64, 51, 0.08)",
        card: "0 4px 24px rgba(92, 64, 51, 0.10)",
        lifted: "0 12px 40px rgba(92, 64, 51, 0.16)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out both",
        "fade-in-up": "fade-in-up 0.6s ease-out both",
        "pop-in": "pop-in 0.3s ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
