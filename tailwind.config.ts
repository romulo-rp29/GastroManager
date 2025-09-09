import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../pages/**/*.{js,ts,jsx,tsx}",
    "../components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        border: { DEFAULT: "var(--border)", input: "var(--input)", ring: "var(--ring)" },
        "medical-blue": "var(--medical-blue)",
        "medical-green": "var(--medical-green)",
        "medical-amber": "var(--medical-amber)",
        "medical-red": "var(--medical-red)",
      },
      fontFamily: { sans: ["var(--font-sans)"] },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
  corePlugins: { preflight: true },
};

export default config;
