/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // habilita dark mode via class
  theme: {
    extend: {
      colors: {
        'medical-blue': 'hsl(220.9, 70%, 50%)',
        'medical-green': 'hsl(160, 84.1%, 39.4%)',
        'medical-amber': 'hsl(25, 95%, 53.1%)',
        'medical-red': 'hsl(0, 72.2%, 50.6%)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 
          '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // habilita dark mode via class
  theme: {
    extend: {
      colors: {
        'medical-blue': 'hsl(220.9, 70%, 50%)',
        'medical-green': 'hsl(160, 84.1%, 39.4%)',
        'medical-amber': 'hsl(25, 95%, 53.1%)',
        'medical-red': 'hsl(0, 72.2%, 50.6%)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 
          '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
