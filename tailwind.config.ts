import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        field: "#2e7d5b",
        trophy: "#f4b63f",
        sky: "#e7f2ff",
        ink: "#19302b"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(25, 48, 43, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
