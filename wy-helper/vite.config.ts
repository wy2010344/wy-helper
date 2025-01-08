import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
/**
 https://www.raulmelo.me/en/blog/build-javascript-library-with-multiple-entry-points-using-vite-3#using-vite-32-or-later
 */
export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        kanren: resolve(__dirname, 'src/kanren.ts'),
        tokenParser: resolve(__dirname, 'src/tokenParser/index.ts'),
        infixLang: resolve(__dirname, 'src/infixLang/index.ts'),
        ObserverCenter: resolve(__dirname, 'src/observerCenter/index.ts'),
        router: resolve(__dirname, 'src/router/index.ts'),
        forceLayout: resolve(__dirname, 'src/forceLayout/index.ts'),
      },
      formats: ["es", "cjs"]
    },
    minify: false,
    rollupOptions: {
      external: [
        /^d3-binarytree(\/)?/,
        /^d3-quadtree(\/)?/,
        /^d3-octree(\/)?/,
      ]
    }
  },
  plugins: [dts()]
})