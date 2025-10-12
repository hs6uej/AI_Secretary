export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        primary: '#00A94F',
        secondary: '#007AFF',
        'background-light': '#F5F5F7',
        text: '#333333',
        error: '#FF3B30',
        warning: '#FF9500',
        success: '#00C853',
      },
      fontFamily: {
        inter: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}