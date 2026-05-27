import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    kanren: './src/kanren/index.ts',
    tokenParser: './src/tokenParser/index.ts',
    infixLang: './src/infixLang/index.ts',
    ObserverCenter: './src/observerCenter/index.ts',
    router: './src/router/index.ts',
    forceLayout: './src/forceLayout/index.ts',
    viteImportMap: './src/viteImportMap/index.ts',
    'infix-o': './src/infix-o/index.ts',
    'state-function': './src/state-function/index.ts',
  },
  platform: 'neutral',
  dts: true,
  deps: {
    neverBundle: [
      /^d3-binarytree(\/)?/,
      /^d3-quadtree(\/)?/,
      /^d3-octree(\/)?/,
      /^vite(\/)?/,
    ],
  },
  format: ['esm', 'cjs'],
});
