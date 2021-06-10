const colors = require('tailwindcss/colors');

module.exports = {
  purge: [
    './src/**.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        xl: '2rem'
      },
      width: {
        600: '600px'
      },
    },
  },
  variants: {},
  plugins: [],
}