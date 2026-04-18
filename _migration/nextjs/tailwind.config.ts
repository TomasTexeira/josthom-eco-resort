import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#FEF6EE",  // muy claro — fondos de íconos
          100: "#FDE8D0",  // claro
          200: "#FBD0A1",  // medio claro
          500: "#E07B2A",  // naranja suave
          600: "#C2651A",  // naranja principal (botones, labels)
          700: "#A85515",  // hover
          800: "#8B4210",  // active / dark
          900: "#6B3008",  // muy oscuro
        },
        charcoal: {
          800: "#222222",
          900: "#1A1A1A",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      animation: {
        "fade-in":  "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-left":  "slideInLeft 0.7s ease-out",
        "slide-in-right": "slideInRight 0.7s ease-out",
      },
      keyframes: {
        fadeIn:       { from: { opacity: "0" },                               to: { opacity: "1" } },
        slideUp:      { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideInLeft:  { from: { opacity: "0", transform: "translateX(-30px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        slideInRight: { from: { opacity: "0", transform: "translateX(30px)" },  to: { opacity: "1", transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
