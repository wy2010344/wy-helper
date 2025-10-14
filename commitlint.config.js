export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'wy-helper',
        'wy-dom-helper',
        'core',
        'dom-helper',
        'tokenParser',
        'infixLang',
        'kanren',
        'router',
        'forceLayout',
        'viteImportmap',
        'infix-o',
        'observerCenter',
        'utils',
        'types',
        'deps',
        'workspace',
      ],
    ],
  },
}
