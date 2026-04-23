/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#16324F',
          50: '#e8edf2',
          100: '#c5d3de',
          200: '#9eb7c9',
          300: '#779bb4',
          400: '#5785a3',
          500: '#16324F',
          600: '#122c46',
          700: '#0e253b',
          800: '#0a1e30',
          900: '#061525',
        },
        gold: {
          DEFAULT: '#C8A96B',
          50: '#faf5eb',
          100: '#f2e4c4',
          200: '#e8d09a',
          300: '#debb70',
          400: '#d4a84b',
          500: '#C8A96B',
          600: '#b8944e',
          700: '#9e7d3f',
          800: '#846630',
          900: '#6a4f21',
        },
        ivory: {
          DEFAULT: '#F7F5F0',
          50: '#fefefe',
          100: '#faf9f7',
          200: '#F7F5F0',
          300: '#f0ede5',
          400: '#e6e2d8',
          500: '#d8d3c6',
        },
        charcoal: {
          DEFAULT: '#22262B',
          light: '#3a3f47',
          muted: '#5a6170',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(22, 50, 79, 0.12)',
        'glass-lg': '0 16px 48px 0 rgba(22, 50, 79, 0.16)',
        card: '0 2px 12px rgba(22, 50, 79, 0.08)',
        'card-hover': '0 8px 24px rgba(22, 50, 79, 0.14)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)',
      },
    },
  },
  plugins: [],
}
