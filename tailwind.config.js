/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nordsteinPurple: '#451a3d',
        nordsteinBeige: '#e6ded3',
        hfLightGrey: '#d2d2d2',
        blackBody: '#1f1c1f',
      },
      fontFamily: {
        heading: ['"Inter Tight Semi"', 'sans-serif'],
        subheading: ['"Inter Tight"', 'sans-serif'],
        body: ['"Inter Tight"', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
