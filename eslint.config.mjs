// @ts-check
// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    // Type of the project. 'lib' for libraries, the default is 'app'
    type: 'lib',
    unocss: false,
    formatters: true,
    typescript: true,
    vue: false,
    stylistic: true,
    react: false,
    jsonc: false,
    yaml: false,

    ignores: [
      '**/build',
      '**/dist',
      '**/public',
      '**/built',
      '**/assets',
      'node_modules',
      'dist',
      'build',
      'public',
      '**/docs',
      '**/README.md',
    ],
  },
  {
    rules: {
      'ts/explicit-function-return-type': 'off',
      'style/no-multiple-empty-lines': 'warn',
      'ts/no-require-imports': 'off',
      'vue/no-unused-vars': 'off',
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'vue/no-console': 'off',
      'node/prefer-global/console': 'off',
      'prefer-promise-reject-errors': 'warn',
      'no-undef': 'warn',
      'import/order': 'off',
      'eslintvue/html-indent': 'off',
      'antfu/top-level-function': 'off',
      'ts/no-var-requires': 'off',
      'style/eol-last': 'warn',
      'no-prototype-builtins': 'warn',
      'jsdoc/require-returns-description': 'off',
    },
  },
)
