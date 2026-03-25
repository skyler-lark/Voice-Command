import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#439c84",
        secondary: "#8c6bed",
        surface: "#050607",
        surface2: "#0b0c0d",
        surface3: "#111214",
      },
      boxShadow: {
        glass: "0 8px 30px rgba(0,0,0,0.35)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;