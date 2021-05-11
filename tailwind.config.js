// tailwind.config.js
module.exports = {
  purge: [
    './src/**.html'
  ],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      borderRadius: {
        xl: '2rem'
      }
    },
  },
  variants: {},
  plugins: [],
}