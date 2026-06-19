import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


// Versión única de este build. Se inyecta en el bundle como __APP_VERSION__ y
// se escribe en dist/version.json. El cliente compara ambas en runtime: si el
// version.json del servidor difiere del baked en el bundle que corre, hay un
// deploy nuevo y fuerza un reload (cache-busting). Ver src/lib/version.ts.
const BUILD_VERSION = String(Date.now())

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// Emite dist/version.json con la versión de este build.
function buildVersionFile() {
  return {
    name: 'build-version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: BUILD_VERSION }),
      })
    },
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_VERSION),
  },
  plugins: [
    figmaAssetResolver(),
    buildVersionFile(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
