/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'space-navy': {
          50: '#e6e9f0',
          100: '#ccd3e1',
          200: '#99a7c3',
          300: '#667ba5',
          400: '#334f87',
          500: '#0a1929',
          600: '#081424',
          700: '#060f1b',
          800: '#040a12',
          900: '#020509',
        },
        'neon-cyan': {
          50: '#e6fcff',
          100: '#ccf9ff',
          200: '#99f3ff',
          300: '#66edff',
          400: '#33e7ff',
          500: '#00e1ff',
          600: '#00b4cc',
          700: '#008799',
          800: '#005a66',
          900: '#002d33',
        },
        'soft-lavender': {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 225, 255, 0.5)',
        'neon-lavender': '0 0 20px rgba(139, 92, 246, 0.5)',
      },
    },
  },
  plugins: [],
};