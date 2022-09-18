import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {resolve} from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  root:'./src',
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      name:'virtual-assistant'
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['react'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          react: 'React'
        }
      }
    }
  }
})
