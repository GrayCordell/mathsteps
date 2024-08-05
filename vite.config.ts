/// <reference types="vitest" />
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import camelCase from 'camelcase'
import packageJson from './package.json'

const packageName = packageJson.name.split('/').pop() || packageJson.name

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/main.js'),
      formats: ['es', 'cjs', 'umd', 'iife'],
      name: camelCase(packageName, { pascalCase: true }),
      fileName: packageName,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [], // ex. ['vue']
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {}, // ex. 'vue': 'Vue'
      },
    },
  },
  resolve: {
    alias: {
      '~/': `${resolve(__dirname, 'lib')}/`,
      'mathjs/util': resolve(__dirname, 'node_modules/mathjs/lib/esm/function/algebra/simplify/util.js'),
      'mathjs/utilObject': resolve(__dirname, 'node_modules/mathjs/lib/esm/utils/object.js'),
      'mathjs/utilIs': resolve(__dirname, 'node_modules/mathjs/lib/esm/utils/is.js'),
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
  ],
  // https://github.com/vitest-dev/vitest
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.test.js'],
    environment: 'jsdom',
  },
})
