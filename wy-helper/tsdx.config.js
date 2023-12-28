
const path = require("path");

const relativePath = p => path.join(__dirname, p);
module.exports = {
  rollup(config, options) {
    if (options.format === 'esm') {
      return {
        ...config,
        input: [
          relativePath("src/index.ts"),
          relativePath("src/kanren.ts"),
          relativePath("src/tokenParser.ts"),
          relativePath("src/Vue.ts"),
        ],
        output: {
          ...config.output,
          file: undefined,
          dir: relativePath("dist/esm"),
          preserveModules: true,
          preserveModulesRoot: relativePath("src"),
        },
      }
    }
    return config
  },
};