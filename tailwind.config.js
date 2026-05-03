/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0a0e17',
          dark: '#0d1321',
          panel: '#111827',
          border: '#1e3a5f',
          cyan: '#00f0ff',
          'cyan-dim': '#00a8b3',
          blue: '#0ea5e9',
          'blue-dark': '#0369a1',
          green: '#10b981',
          red: '#ef4444',
          orange: '#f59e0b',
          text: '#e2e8f0',
          'text-dim': '#94a3b8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
