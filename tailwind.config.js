module.exports = {
  content: [
    "./_includes/**/*.html",
    "./_layouts/**/*.html",
    "./_posts/*.md",
    "./*.html",
    "./css/site.css",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050505",
      },
      animation: {
        fadeIn: "fadeIn 2s ease-in forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      borderRadius: {
        xl: "2rem",
      },
      boxShadow: {
        red: "0 4px 25px 0 rgba(128, 128, 128, 0.50)",
      },
    },
  },
};
