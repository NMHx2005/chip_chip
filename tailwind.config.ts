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
        bg: "#E5E5E5",
        surface: "#FFFFFF",
        "surface-muted": "#EFEFEF",
        primary: "#0D0D0D",
        accent: "#314344",
        "accent-teal": "#317e6a",

        text: "#000000",
        "text-muted": "#3e424d",
        "text-nav": "#4d4d4d",
        muted: "#6B7280",

        // Topic colours are not a Tailwind palette on purpose — they live in
        // `lib/constants.ts` (TOPIC_TONE) as inline styles, since the tone is
        // data the components read per topic rather than a class name.

        border: "#D1D1D1",
        input: "#D1D1D1",
        ring: "#314344",
      },

      fontFamily: {
        sans: ["var(--font-be-vietnam-pro)", "sans-serif"],
        display: ["var(--font-be-vietnam-pro)", "sans-serif"],
        body: ["var(--font-be-vietnam-pro)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },

      backgroundImage: {
        "brand-gradient":
          "linear-gradient(131deg, rgb(51, 51, 51) 0.79%, rgb(13, 13, 13) 35.22%, rgb(38, 38, 38) 99.16%)",
      },

      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06)",
        "card-hover":
          "0 2px 4px rgba(0, 0, 0, 0.05), 0 12px 32px rgba(0, 0, 0, 0.12)",
        float: "0 8px 32px rgba(0, 0, 0, 0.16)",
      },

      animation: {
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },

      maxWidth: {
        content: "1280px",
        prose: "72ch",
      },
    },
  },
  plugins: [],
};

export default config;
