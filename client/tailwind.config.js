/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        noir: { DEFAULT: '#0B0A09', 900: '#0B0A09', 800: '#141210', 700: '#1D1A17', 600: '#2A2622' },
        ivory: { DEFAULT: '#F5EFE6', 50: '#FBF8F3', 100: '#F5EFE6', 200: '#EBE2D4', 300: '#DDD0BC' },
        gold: { DEFAULT: '#C9A66B', light: '#E7CF9F', pale: '#F3E6C8', deep: '#9C7A3F' },
        amber: { q: '#E8781E', soft: '#F6B26B' },
        azure: { q: '#2A8FD8', soft: '#8CC6EE' },
        blush: '#E9C9C1',
        ink: '#3A332C',
        mute: '#8A8076',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        arabic: ['"Noto Kufi Arabic"', 'Manrope', 'sans-serif'],
      },
      transitionTimingFunction: { lux: 'cubic-bezier(.16,1,.3,1)' },
      letterSpacing: { eyebrow: '0.28em' },
    },
  },
  plugins: [],
};
