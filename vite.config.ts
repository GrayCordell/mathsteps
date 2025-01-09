/// <reference types="vitest" />
import { resolve } from 'node:path'
import camelCase from 'camelcase'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import packageJson from './package.json'

const packageName = packageJson.name.split('/').pop() || packageJson.name
export default defineConfig({
  base: './',
  build: {
    minify: false, // Disable minification
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      formats: ['es'],
      name: camelCase(packageName, { pascalCase: true }),
      fileName: format => `${packageName}.${format}.js`,
    },
    rollupOptions: {
      output: [
        {
          format: 'es',
          dir: 'dist/es/', // Output ES modules here
          sourcemap: false,
          sourcemapExcludeSources: true,
          inlineDynamicImports: false,
          preserveModules: true,
          entryFileNames: `[name].js`,
        },
        {
          format: 'cjs',
          dir: 'dist/cjs/', // Output CommonJS modules here
          sourcemap: false,
          sourcemapExcludeSources: true,
          inlineDynamicImports: false,
          preserveModules: true,
          entryFileNames: `[name].js`,
        },
      ],
    },
  },
  resolve: {
    alias: {
      '~/': `${resolve(__dirname, 'lib')}/`,
    },
  },
  plugins: [
    dts({
      outDir: 'dist/types',
      tsconfigPath: 'tsconfig.json',
      include: 'lib',
      entryRoot: 'lib',
      insertTypesEntry: true,
      rollupTypes: true,
      copyDtsFiles: false,
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts', 'test/**/*.test.js'],
    exclude: [
      'node_modules',
      'dist',
      // eslint-disable-next-line node/prefer-global/process
      ...(process.env.VITEST_EXCLUDE ? process.env.VITEST_EXCLUDE.split(',') : []),
    ],
  },
})
