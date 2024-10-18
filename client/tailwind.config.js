/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1DA1F2', // Customize your primary color
        secondary: '#F24E1E', // Customize your secondary color
        accent: '#FFB800', // Customize your accent color
        // Add more custom colors as needed
      },
    },
  },
  daisyui: {
    themes: [
      {
        mytheme: { // Define your custom theme
          "primary": "#1DA1F2",
          "secondary": "#F24E1E",
          "accent": "#FFB800",
          "neutral": "#3D4451",
          "base-100": "#FFFFFF", // Background color
          "info": "#2094F3",
          "success": "#009485",
          "warning": "#FF9900",
          "error": "#FF5724",
        },
      },
      // Include other default DaisyUI themes if desired
      "light", // Default light theme
      "dark", // Default dark theme
      "cupcake", // Another theme
      "dracula", // Another theme
      // You can also add more pre-defined themes here
    ],
    // Set the default theme
    defaultTheme: "mytheme",
  },
  plugins: [require("daisyui")],
}
