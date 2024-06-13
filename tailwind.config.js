/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: ["class", '[data-mode="dark"]'],

  theme: {
    fontFamily: {
      poppins: ["Poppins", "sans-serif"],
      rubik: ["Rubik", "sans-serif"],
    },
    extend: {
      colors: {
        customOrange: {
          400: "rgb(238, 125, 16)",
        },
        customBlue: {
          400: "rgb(0, 44, 104)",
        },
      },
    },
    screens: {
      sm: "576px",
      md: "768px",
      lg: "992px",
      xl: "1200px",
      "2xl": "1400px",
    },

    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "9rem",
      },
    },
  },
  plugins: [],
};
