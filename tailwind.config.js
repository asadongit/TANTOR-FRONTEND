module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scrollbarThumb: '#C8C9CB',
        scrollbarTrack: 'transparent',
      },
      spacing: {
        scrollbarWidth: '4px',
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '::-webkit-scrollbar-button': {
          display: 'none',
          width: '0px',
          height: '0px',
        },
        '::-webkit-scrollbar': {
          width: '4px',
          height: '4px',
        },
        // Track
        '::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        // Thumb
        '::-webkit-scrollbar-thumb': {
          background: '#C8C9CB',
          borderRadius: '10px',
        },
        // Thumb hover
        '::-webkit-scrollbar-thumb:hover': {
          background: '#6e5a99',
        },
        // Corner where both scrollbars meet
        '::-webkit-scrollbar-corner': {
          background: 'transparent',
        },
        // Firefox
        '*': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#C8C9CB transparent',
        },
      });
    },
  ],
}