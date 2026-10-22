/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
          DEFAULT: '#2563eb', // FMATH12 Electric Blue
          light: '#eff6ff',   // Soft Blue Sky
          dark: '#1d4ed8',
          hover: '#1e40af',
        },
        fmath: {
          blue: '#2563eb',
          sky: '#0ea5e9',
          cyan: '#06b6d4',
          teal: '#0d9488',
          emerald: '#10b981',
          navy: '#0f172a',
          slate: '#1e293b',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
        aura: {
          cyan: '#06b6d4',
          blue: '#2563eb',
          sky: '#0ea5e9',
          purple: '#6366f1',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
        },
        secondary: {
          DEFAULT: '#0f172a', // Deep Slate
          light: '#f8fafc',
          muted: '#64748b',
        },
        accent: {
          DEFAULT: '#0ea5e9', // Vibrant Sky Blue
          light: '#f0f9ff',
        },
        background: '#f8fafc',
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', '"Be Vietnam Pro"', 'sans-serif'],
        raleway: ['"Raleway"', 'sans-serif'],
        display: ['"Raleway"', '"Plus Jakarta Sans"', 'sans-serif'],
        ui: ['"Be Vietnam Pro"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'bs-card': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)', 
        'bs-hover': '0 20px 35px -8px rgba(37, 99, 235, 0.18), 0 6px 12px -2px rgba(15, 23, 42, 0.04)',
        'fmath': '0 0 25px -4px rgba(37, 99, 235, 0.25)',
        'fmath-lg': '0 0 45px -6px rgba(37, 99, 235, 0.35)',
        'fmath-cyan': '0 0 25px -4px rgba(14, 165, 233, 0.3)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'float': 'float 5s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}