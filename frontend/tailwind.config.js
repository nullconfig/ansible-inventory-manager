/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html",
    "./*.html",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-color)',
          light: 'color-mix(in srgb, var(--primary-color), white 30%)',
          dark: 'color-mix(in srgb, var(--primary-color), black 20%)',
        },
        secondary: {
          DEFAULT: 'var(--secondary-color)',
        },
        background: {
          DEFAULT: 'var(--bg-color)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
        },
        selected: {
          DEFAULT: 'var(--selected-bg)',
        },
        'table-header': {
          DEFAULT: 'var(--table-header-bg)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family)'],
      },
    },
  },
  plugins: [],
}