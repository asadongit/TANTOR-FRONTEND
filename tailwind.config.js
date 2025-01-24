module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scrollbarThumb: '#8e78b7',
        scrollbarTrack: '#f0f0f0',
      },
      spacing: {
        scrollbarWidth: '8px',
      },
    },
  },
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        '::-webkit-scrollbar': {
          width: theme('spacing.scrollbarWidth'),
          height: theme('spacing.scrollbarWidth'),
        },
        '::-webkit-scrollbar-track': {
          background: theme('colors.scrollbarTrack'),
        },
        '::-webkit-scrollbar-thumb': {
          background: theme('colors.scrollbarThumb'),
          borderRadius: '10px',
        },
        '::-webkit-scrollbar-thumb:hover': {
          background: '#6e5a99', 
        },
      });
    },
  ],
}
