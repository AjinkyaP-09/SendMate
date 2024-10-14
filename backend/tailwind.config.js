/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}", "./views.{ejs,html}"],
  theme: {
    extend: {
      colors: {
        customBlue: "#A6C1FA",
      },
    },
  },
  plugins: [],
};
