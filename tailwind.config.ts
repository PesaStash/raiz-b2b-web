import type { Config } from "tailwindcss";

import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        desktop: "1350px",
      },
      fontFamily: {
        inter: ["var(--font-inter)", ...fontFamily.sans],
        monzo: ["var(--monzo)", ...fontFamily.sans],
        brSonoma: ["var(--font-br-sonoma)", ...fontFamily.sans],
      },
      colors: {
        primary: "#4B0082",
        primary2: "#3C2875",
        secondary: {
          white: "#F4F4F4",
        },
        pesaRaise10: "#F1E0CB",
        text: {
          terttiary: {
            600: "#475467",
          },
        },
        raiz: {
          gray: {
            50: "#FCFCFD",
            100: "#F3F1F6",
            200: "#E4E0EA",
            300: "#D0C8D9",
            400: "#B5A8C4",
            500: "#A89AB9",
            600: "#6F5B86",
            700: "#443852",
            800: "#2C2435",
            900: "#1E1924",
            950: "#19151E",
          },
          usd: {
            primary: "#0D6494",
          },
          crypto: {
            primary: "#0055CC",
          },
          purple: {
            90: "#54098b",
          },
          success: {
            500: "#17B26A",
          },
          error: "#DC180D",
        },
        background: "rgba(234, 236, 255, 0.6)",
      },
    },
  },
  plugins: [],
} satisfies Config;
