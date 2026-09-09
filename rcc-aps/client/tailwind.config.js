/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: '#6B1A1A',
          dark: '#4A1010',
          light: '#8B2E2E'
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C97E',
          pale: '#F5EDD3'
        },
        cream: {
          DEFAULT: '#F9F7F4'
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Source Sans 3"', 'sans-serif']
      }
    }
  },
  plugins: []
};
