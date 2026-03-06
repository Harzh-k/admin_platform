import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Add this import

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // Tailwind v4 plugin handles the CSS processing
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
})