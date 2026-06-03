/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,html}"],
  theme: {
    extend: {
      colors: {
        primary: "#1e90ff",
        secondary: "#f59e0b",
        accent: "#ef4444",
        bg: "#eef8f6",
      },
    },
  },
  plugins: [],
};
