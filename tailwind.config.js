/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        brand: {
          DEFAULT: '#c8102e',   // ARY red
          dark:    '#9b0c22',
          light:   '#f5c6cd',
        }
      }
    },
  },
  plugins: [],
}
