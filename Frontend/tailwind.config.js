/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Poppins', ...defaultTheme.fontFamily.sans],
        'roboto': ['Roboto', ...defaultTheme.fontFamily.sans],
      },
      colors:{
        'primary':{
          DEFAULT:'#FBC700',
          '100':'#e3b400',
        },
      },
    },
  },
  plugins: [],
}