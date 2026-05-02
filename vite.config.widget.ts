import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// Configuración separada para build del widget
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  define: {
    'process.env': {} // Define process.env as empty object for browser
  },
  build: {
    lib: {
      entry: 'src/widget/widget-entry.tsx',
      name: 'YokoWidget',
      fileName: 'yoko-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'yoko-widget.js'
      }
    }
  }
});
