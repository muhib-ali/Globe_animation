/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
    theme: {
    extend: {
      fontFamily: {
        instrument: ['"Instrument Sans"', 'sans-serif'],
        poppins: ['"Poppins"', 'sans-serif'],
        anonymous: ['"Anonymous Pro"', 'monospace'],
      },
    },
  },
  plugins: [],
}
