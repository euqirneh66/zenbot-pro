/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        trading: {
          green: "#10b981",
          red: "#f43f5e",
          darkBg: "#090d16",
          darkCard: "#0f172a",
          darkBorder: "#1e293b",
        }
      }
    },
  },
  plugins: [],
};
