/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        veil: {
          bg: "#0b0c10",
          panel: "#14151c",
          accent: "#8a2be2",
          gold: "#c9a44c",
          text: "#e8e6e3"
        }
      }
    }
  },
  plugins: []
};
