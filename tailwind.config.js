/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream:     "#F5F0E8",
        ink:       "#1C1917",
        terracota: "#A07850",
        celeste:   "#75AADB",
        border:    "#E0D9CE",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
