/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#c9a227",
        dark: {
          DEFAULT: "#111111",
          card: "#1a1a1a",
          border: "#333333",
          muted: "#444444",
        },
      },
      fontFamily: {
        script: ['"Courier Prime"', '"Courier New"', "monospace"],
      },
    },
  },
  plugins: [],
};
