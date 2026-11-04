import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        sheet: "var(--sheet)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        rule: "var(--rule)",
        "rule-margin": "var(--rule-margin)",
        owed: "var(--owed)",
        paid: "var(--paid)",
        "alert-ink": "var(--alert-ink)",
        "alert-wash": "var(--alert-wash)",
        focus: "var(--focus)",
      },
      borderRadius: {
        chip: "var(--radius-chip)",
        control: "var(--radius-control)",
        sheet: "var(--radius-sheet)",
      },
      minHeight: {
        tap: "var(--tap)",
      },
      minWidth: {
        tap: "var(--tap)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
