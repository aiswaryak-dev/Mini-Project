/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plant: {
          primary: '#16883D',
          hover: '#127132',
          dark: '#063D24',
          deep: '#032314',
          light: '#EAF6E8',
          bg: '#F4F7F4',
          card: '#FFFFFF',
          text: '#063D24',
          muted: '#64748B',
          border: '#E2E8F0',
          accent: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          blue: '#3B82F6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(6, 61, 36, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'card': '0 10px 30px -5px rgba(22, 136, 61, 0.06), 0 4px 12px -2px rgba(6, 61, 36, 0.03)',
        'elevated': '0 20px 40px -15px rgba(6, 61, 36, 0.12)',
        'glow': '0 0 25px rgba(34, 197, 94, 0.35)'
      },
      fontSize: {
        'xs': ['0.9375rem', { lineHeight: '1.45rem' }],
        'sm': ['1rem', { lineHeight: '1.55rem' }],
        'base': ['1.0625rem', { lineHeight: '1.65rem' }],
        'lg': ['1.1875rem', { lineHeight: '1.75rem' }],
        'xl': ['1.375rem', { lineHeight: '1.85rem' }],
        '2xl': ['1.625rem', { lineHeight: '2.1rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.35rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.6rem' }]
      }
    },
  },
  plugins: [],
}
