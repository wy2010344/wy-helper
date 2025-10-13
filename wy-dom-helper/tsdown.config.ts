import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    contentEditable: './src/contentEditable/index.ts',
    canvas: './src/canvas/index.ts',
  },
  platform: 'neutral',
  dts: true,
  external: [/^wy-helper(\/)?/],
  format: ['esm', 'cjs'],
})
