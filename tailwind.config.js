module.exports = {
  purge: ["./src/**.html"],
  darkMode: "media",
  theme: {
    colors: {
      ...require("tailwindcss/colors"),
      bgGray: {
        DEFAULT: "#0b0b0c",
      },
    },
    extend: {
      borderRadius: {
        xl: "2rem",
      },
      width: {
        600: "600px",
        768: "768px",
      },
    },
  },
  variants: {},
  plugins: [require("tailwind-scrollbar-hide")],
};
