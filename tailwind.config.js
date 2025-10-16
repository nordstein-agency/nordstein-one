/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['"Inter Tight"', 'sans-serif'],
      },
      colors: {
        nordsteinBeige: '#e6ded3',
        nordsteinPurple: '#451a3d',
      },
    },
  },
  plugins: [],
}
