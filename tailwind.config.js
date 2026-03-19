/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#065F46",
      },
      fontFamily: {
        display: ["Public Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
}