// @ts-check
import antfu from '@antfu/eslint-config'
import scopedPlugin from 'eslint-plugin-scoped-construct'
// import { FlatCompat } from "@eslint/eslintrc";
// const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
// const compat = new FlatCompat({ baseDirectory: __dirname });


// baseConfig: https://github.com/antfu/eslint-config
export default antfu(
  {
    // https://eslint-plugin-perfectionist.azat.io/
    lessOpinionated: false,
    formatters: false,
    toml: false,
    svelte: false,
    solid: false,
    astro: false,
    jsx: false,
    unocss: false,
    markdown: false,
    regexp: false,
    vue: false,
    react: false,
    jsonc: false,
    yaml: false,
    test: true,

    // https://eslint.org/
    javascript: {
      overrides: {
      },
    },

    // https://typescript-eslint.io/
    typescript: {
      overrides: {
        'ts/strict-boolean-expressions': 'off',
        'ts/no-require-imports': 'off',
        'ts/no-unsafe-argument': 'off',
        'ts/no-unsafe-return': 'off',
        'ts/no-unsafe-member-access': 'off',
        'ts/no-var-requires': 'off',
      },
    },
    stylistic: {
      overrides: {
        'style/no-multiple-empty-lines': 'warn',
      },
    },
    // General/Applied everywhere
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'antfu/top-level-function': 'off',
      'node/prefer-global/console': 'off',
      'vue/no-console': 'off',

      'prefer-promise-reject-errors': 'warn',
      'no-undef': 'warn',
      'import/order': 'off',
      'style/eol-last': 'warn',
      'no-prototype-builtins': 'warn',
      'jsdoc/require-returns-description': 'off',
      'unused-imports/no-unused-vars': 'off', // already warned via no-unused-vars
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
    plugins: {
      scoped: scopedPlugin,
    },
    rules: {
      'scoped/enforce-scoped-construct': [
        'error',
        {
          functionName: 'scoped',
          exceptions: ['console', 'process'],
          requireFunctionsInScope: true,
        },
      ],
    },
  },
)
