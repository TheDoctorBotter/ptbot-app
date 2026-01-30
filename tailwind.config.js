/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary - Scarlet (brand color)
        primary: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#C41E3A',  // Main brand scarlet
          600: '#B91C1C',  // Darker scarlet for hover states
          700: '#991B1B',
          800: '#7F1D1D',
          900: '#450A0A',
          DEFAULT: '#C41E3A',
        },
        // Neutrals - Gray scale (overriding default gray)
        neutral: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
        },
        // Semantic aliases for easy access
        scarlet: '#C41E3A',
        'scarlet-dark': '#B91C1C',
        'scarlet-light': '#FEE2E2',
      },
      // Override default ring color
      ringColor: {
        DEFAULT: '#C41E3A',
      },
      // Override default border color focus
      borderColor: {
        focus: '#C41E3A',
      },
    },
  },
  plugins: [],
};
