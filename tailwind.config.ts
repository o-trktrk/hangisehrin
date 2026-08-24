import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF8",
        ink: "#141414",
        line: "#DCDAD4",
        muted: "#6B6B66",
        accent: "#B3271A"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      maxWidth: {
        wrap: "760px"
      }
    }
  },
  plugins: []
};

export default config;
