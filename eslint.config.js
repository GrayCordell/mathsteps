// @ts-check
// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    // Type of the project. 'lib' for libraries, the default is 'app'
    type: 'lib',
    toml: false,
    svelte: false,
    scss: false,
    solid: false,
    astro: false,
    jsx: false,
    unocss: false,
    formatters: false,
    markdown: false,
    regexp: false,
    node: false,
    vue: false,
    stylistic: true,
    react: false,
    jsonc: false,
    yaml: false,
    test: true,

    typescript: {
      parserOptions: {
        project: './tsconfig.json',
      },
      overrides: {
        'ts/strict-boolean-expressions': ['error', {
          /** Whether to allow `any` in a boolean context. */
          allowAny: true,
          /** Whether to allow nullable `boolean`s in a boolean context. */
          allowNullableBoolean: true,
          /** Whether to allow nullable `enum`s in a boolean context. */
          allowNullableEnum: false,
          /** Whether to allow nullable `number`s in a boolean context. */
          allowNullableNumber: false,
          /** Whether to allow nullable `object`s in a boolean context. */
          allowNullableObject: true,
          /** Whether to allow nullable `string`s in a boolean context. */
          allowNullableString: true,
          /** Whether to allow `number` in a boolean context. */
          allowNumber: false,
          /** Whether to allow `string` in a boolean context. */
          allowString: true,
        }],
      },
    },

    ignores: [
      '**/build',
      '**/dist',
      '**/public',
      '**/built',
      '**/assets',
      '**/fixtures',
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

      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-return': 'off',
      'ts/no-unsafe-member-access': 'off',
    },
  },
)
