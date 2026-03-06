/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#0052CC',
        'brand-dark': '#0747A6', 
        'brand-bg': '#F4F5F7',   
      },
    },
  },
  plugins: [],
}