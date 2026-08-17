import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e3a8a",
          foreground: "#f1f5f9",
        },
        accent: {
          DEFAULT: "#64748b",
          foreground: "#ffffff",
        },
        light: {
          bg: "#ffffff",
          "bg-muted": "#f1f5f9",
          card: "#ffffff",
          border: "#e2e8f0",
          text: "#0f172a",
          "text-muted": "#64748b",
        },
        dark: {
          bg: "#09090b",
          "bg-muted": "#18181b",
          card: "#18181b",
          border: "#27272a",
          text: "#fafafa",
          "text-muted": "#a1a1aa",
        },
        success: {
          DEFAULT: "#15803d",
          foreground: "#f0fdf4",
        },
        warning: {
          DEFAULT: "#a16207",
          foreground: "#fefce8",
        },
        error: {
          DEFAULT: "#b91c1c",
          foreground: "#fef2f2",
        },
        info: {
          DEFAULT: "#64748b",
          foreground: "#f1f5f9",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
