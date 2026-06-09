import type { Config } from 'tailwindcss';

// Brand palette from docs/01-brand-brief.md
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        lake: {
          DEFAULT: '#0F4C81', // Lake Deep Blue (primary)
          dark: '#0A3258',    // Midnight Kivu
        },
        gold: '#F2A516',      // Sunrise Gold (accent)
        forest: '#2E7D52',    // Success
        clay: '#C0392B',      // Danger
        ink: '#1A1A1A',
        stone: '#6B7280',
        mist: '#F4F6F8',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
