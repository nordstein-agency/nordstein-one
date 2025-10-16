/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        nordsteinPurple: '#451a3d',
        nordsteinBeige: '#e6ded3',
        hfGrey: '#d2d2d2',
      },
      fontFamily: {
        interTight: ['"Inter Tight"', 'sans-serif'],
        matter: ['Matter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
