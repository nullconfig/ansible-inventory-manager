/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html",
    "./*.html",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class', // Enable class-based dark mode
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
          dark: 'var(--bg-color-dark, #111827)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
          dark: 'var(--border-color-dark, #374151)',
        },
        selected: {
          DEFAULT: 'var(--selected-bg)',
          dark: 'var(--selected-bg-dark, #1f2937)',
        },
        'table-header': {
          DEFAULT: 'var(--table-header-bg)',
          dark: 'var(--table-header-bg-dark, #1f2937)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family, Inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}