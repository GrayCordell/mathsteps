// vite.config.ts
import { resolve } from "node:path";
import { defineConfig } from "file:///Users/waltercordell/Documents/GitHub/mathsteps/node_modules/.pnpm/vite@5.4.0_@types+node@22.1.0/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/waltercordell/Documents/GitHub/mathsteps/node_modules/.pnpm/vite-plugin-dts@4.0.1_@types+node@22.1.0_rollup@4.20.0_typescript@5.5.4_vite@5.4.0/node_modules/vite-plugin-dts/dist/index.mjs";
import camelCase from "file:///Users/waltercordell/Documents/GitHub/mathsteps/node_modules/.pnpm/camelcase@8.0.0/node_modules/camelcase/index.js";

// package.json
var package_default = {
  name: "mathsteps-expermental-fork",
  description: "Step by step math solutions. Experimental Fork",
  version: "0.0.1",
  type: "module",
  private: false,
  packageManager: "pnpm@9.7.0",
  exports: {
    ".": {
      import: "./dist/math-steps-expermental-fork.js",
      require: "./dist/math-steps-expermental-fork.cjs"
    }
  },
  main: "./dist/math-steps-expermental-fork.umd.cjs",
  module: "./dist/math-steps-expermental-fork.js",
  files: [
    "dist"
  ],
  scripts: {
    preinstall: "npx only-allow pnpm",
    dev: "vite --port 3333",
    build: "tsc && vite build",
    preview: "vite preview",
    lint: "eslint .",
    "preview-https": "serve dist",
    test: "vitest",
    "test:e2e": "cypress open",
    "test:unit": "vitest",
    "test:watch": "vitest",
    "test:coverage": "vitest --coverage",
    typecheck: "vue-tsc --noEmit",
    up: "taze major -I",
    sizecheck: "npx vite-bundle-visualizer",
    cleanFix: "rd /s /q node_modules & del /q package-lock.json & del /q pnpm-lock.yaml && pnpm install"
  },
  keywords: [
    "math",
    "steps",
    "algebra",
    "cas",
    "computer",
    "algebra",
    "system"
  ],
  license: "Apache-2.0",
  author: "Grayson Cordell",
  dependencies: {
    "fast-json-stringify": "^6.0.0",
    globals: "^15.9.0",
    mathjs: "^13.0.3",
    mutative: "^1.0.8"
  },
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged"
  },
  "lint-staged": {
    "*": "eslint --fix"
  },
  devDependencies: {
    "@antfu/eslint-config": "^2.25.0",
    "@types/node": "^22.1.0",
    "@typescript-eslint/eslint-plugin": "^8.0.1",
    "@typescript-eslint/parser": "^8.0.1",
    "@vitest/coverage-v8": "^2.0.5",
    "@vue/test-utils": "^2.4.6",
    camelcase: "^8.0.0",
    "cross-env": "^7.0.3",
    eslint: "^9.8.0",
    "eslint-plugin-format": "^0.1.2",
    "https-localhost": "^4.7.1",
    jsdom: "^24.1.1",
    "lint-staged": "^15.2.8",
    pnpm: "^9.7.0",
    rollup: "^4.20.0",
    taze: "^0.16.3",
    typescript: "^5.5.4",
    vite: "^5.4.0",
    "vite-bundle-visualizer": "^1.2.1",
    "vite-plugin-dts": "^4.0.1",
    "vite-plugin-inspect": "^0.8.5",
    vitest: "^2.0.5",
    "vue-tsc": "^2.0.29"
  }
};

// vite.config.ts
var __vite_injected_original_dirname = "/Users/waltercordell/Documents/GitHub/mathsteps";
var packageName = package_default.name.split("/").pop() || package_default.name;
var vite_config_default = defineConfig({
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "lib/main.js"),
      formats: ["es", "cjs", "umd", "iife"],
      name: camelCase(packageName, { pascalCase: true }),
      fileName: packageName
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      // ex. ['vue']
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {}
        // ex. 'vue': 'Vue'
      }
    }
  },
  resolve: {
    alias: {
      "~/": `${resolve(__vite_injected_original_dirname, "lib")}/`,
      "mathjs/util": resolve(__vite_injected_original_dirname, "node_modules/mathjs/lib/esm/function/algebra/simplify/util.js"),
      "mathjs/utilObject": resolve(__vite_injected_original_dirname, "node_modules/mathjs/lib/esm/utils/object.js"),
      "mathjs/utilIs": resolve(__vite_injected_original_dirname, "node_modules/mathjs/lib/esm/utils/is.js")
    }
  },
  plugins: [
    dts({ rollupTypes: true })
  ],
  // https://github.com/vitest-dev/vitest
  test: {
    include: ["test/**/*.test.ts", "test/**/*.test.js"],
    environment: "jsdom"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3dhbHRlcmNvcmRlbGwvRG9jdW1lbnRzL0dpdEh1Yi9tYXRoc3RlcHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy93YWx0ZXJjb3JkZWxsL0RvY3VtZW50cy9HaXRIdWIvbWF0aHN0ZXBzL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy93YWx0ZXJjb3JkZWxsL0RvY3VtZW50cy9HaXRIdWIvbWF0aHN0ZXBzL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cydcbmltcG9ydCBjYW1lbENhc2UgZnJvbSAnY2FtZWxjYXNlJ1xuaW1wb3J0IHBhY2thZ2VKc29uIGZyb20gJy4vcGFja2FnZS5qc29uJ1xuXG5jb25zdCBwYWNrYWdlTmFtZSA9IHBhY2thZ2VKc29uLm5hbWUuc3BsaXQoJy8nKS5wb3AoKSB8fCBwYWNrYWdlSnNvbi5uYW1lXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJ1aWxkOiB7XG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogcmVzb2x2ZShfX2Rpcm5hbWUsICdsaWIvbWFpbi5qcycpLFxuICAgICAgZm9ybWF0czogWydlcycsICdjanMnLCAndW1kJywgJ2lpZmUnXSxcbiAgICAgIG5hbWU6IGNhbWVsQ2FzZShwYWNrYWdlTmFtZSwgeyBwYXNjYWxDYXNlOiB0cnVlIH0pLFxuICAgICAgZmlsZU5hbWU6IHBhY2thZ2VOYW1lLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgLy8gbWFrZSBzdXJlIHRvIGV4dGVybmFsaXplIGRlcHMgdGhhdCBzaG91bGRuJ3QgYmUgYnVuZGxlZFxuICAgICAgLy8gaW50byB5b3VyIGxpYnJhcnlcbiAgICAgIGV4dGVybmFsOiBbXSwgLy8gZXguIFsndnVlJ11cbiAgICAgIG91dHB1dDoge1xuICAgICAgICAvLyBQcm92aWRlIGdsb2JhbCB2YXJpYWJsZXMgdG8gdXNlIGluIHRoZSBVTUQgYnVpbGRcbiAgICAgICAgLy8gZm9yIGV4dGVybmFsaXplZCBkZXBzXG4gICAgICAgIGdsb2JhbHM6IHt9LCAvLyBleC4gJ3Z1ZSc6ICdWdWUnXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ34vJzogYCR7cmVzb2x2ZShfX2Rpcm5hbWUsICdsaWInKX0vYCxcbiAgICAgICdtYXRoanMvdXRpbCc6IHJlc29sdmUoX19kaXJuYW1lLCAnbm9kZV9tb2R1bGVzL21hdGhqcy9saWIvZXNtL2Z1bmN0aW9uL2FsZ2VicmEvc2ltcGxpZnkvdXRpbC5qcycpLFxuICAgICAgJ21hdGhqcy91dGlsT2JqZWN0JzogcmVzb2x2ZShfX2Rpcm5hbWUsICdub2RlX21vZHVsZXMvbWF0aGpzL2xpYi9lc20vdXRpbHMvb2JqZWN0LmpzJyksXG4gICAgICAnbWF0aGpzL3V0aWxJcyc6IHJlc29sdmUoX19kaXJuYW1lLCAnbm9kZV9tb2R1bGVzL21hdGhqcy9saWIvZXNtL3V0aWxzL2lzLmpzJyksXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIGR0cyh7IHJvbGx1cFR5cGVzOiB0cnVlIH0pLFxuICBdLFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vdml0ZXN0LWRldi92aXRlc3RcbiAgdGVzdDoge1xuICAgIGluY2x1ZGU6IFsndGVzdC8qKi8qLnRlc3QudHMnLCAndGVzdC8qKi8qLnRlc3QuanMnXSxcbiAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgfSxcbn0pXG4iLCAie1xuICBcIm5hbWVcIjogXCJtYXRoc3RlcHMtZXhwZXJtZW50YWwtZm9ya1wiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiU3RlcCBieSBzdGVwIG1hdGggc29sdXRpb25zLiBFeHBlcmltZW50YWwgRm9ya1wiLFxuICBcInZlcnNpb25cIjogXCIwLjAuMVwiLFxuICBcInR5cGVcIjogXCJtb2R1bGVcIixcbiAgXCJwcml2YXRlXCI6IGZhbHNlLFxuICBcInBhY2thZ2VNYW5hZ2VyXCI6IFwicG5wbUA5LjcuMFwiLFxuICBcImV4cG9ydHNcIjoge1xuICAgIFwiLlwiOiB7XG4gICAgICBcImltcG9ydFwiOiBcIi4vZGlzdC9tYXRoLXN0ZXBzLWV4cGVybWVudGFsLWZvcmsuanNcIixcbiAgICAgIFwicmVxdWlyZVwiOiBcIi4vZGlzdC9tYXRoLXN0ZXBzLWV4cGVybWVudGFsLWZvcmsuY2pzXCJcbiAgICB9XG4gIH0sXG4gIFwibWFpblwiOiBcIi4vZGlzdC9tYXRoLXN0ZXBzLWV4cGVybWVudGFsLWZvcmsudW1kLmNqc1wiLFxuICBcIm1vZHVsZVwiOiBcIi4vZGlzdC9tYXRoLXN0ZXBzLWV4cGVybWVudGFsLWZvcmsuanNcIixcbiAgXCJmaWxlc1wiOiBbXG4gICAgXCJkaXN0XCJcbiAgXSxcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcInByZWluc3RhbGxcIjogXCJucHggb25seS1hbGxvdyBwbnBtXCIsXG4gICAgXCJkZXZcIjogXCJ2aXRlIC0tcG9ydCAzMzMzXCIsXG4gICAgXCJidWlsZFwiOiBcInRzYyAmJiB2aXRlIGJ1aWxkXCIsXG4gICAgXCJwcmV2aWV3XCI6IFwidml0ZSBwcmV2aWV3XCIsXG4gICAgXCJsaW50XCI6IFwiZXNsaW50IC5cIixcbiAgICBcInByZXZpZXctaHR0cHNcIjogXCJzZXJ2ZSBkaXN0XCIsXG4gICAgXCJ0ZXN0XCI6IFwidml0ZXN0XCIsXG4gICAgXCJ0ZXN0OmUyZVwiOiBcImN5cHJlc3Mgb3BlblwiLFxuICAgIFwidGVzdDp1bml0XCI6IFwidml0ZXN0XCIsXG4gICAgXCJ0ZXN0OndhdGNoXCI6IFwidml0ZXN0XCIsXG4gICAgXCJ0ZXN0OmNvdmVyYWdlXCI6IFwidml0ZXN0IC0tY292ZXJhZ2VcIixcbiAgICBcInR5cGVjaGVja1wiOiBcInZ1ZS10c2MgLS1ub0VtaXRcIixcbiAgICBcInVwXCI6IFwidGF6ZSBtYWpvciAtSVwiLFxuICAgIFwic2l6ZWNoZWNrXCI6IFwibnB4IHZpdGUtYnVuZGxlLXZpc3VhbGl6ZXJcIixcbiAgICBcImNsZWFuRml4XCI6IFwicmQgL3MgL3Egbm9kZV9tb2R1bGVzICYgZGVsIC9xIHBhY2thZ2UtbG9jay5qc29uICYgZGVsIC9xIHBucG0tbG9jay55YW1sICYmIHBucG0gaW5zdGFsbFwiXG4gIH0sXG4gIFwia2V5d29yZHNcIjogW1xuICAgIFwibWF0aFwiLFxuICAgIFwic3RlcHNcIixcbiAgICBcImFsZ2VicmFcIixcbiAgICBcImNhc1wiLFxuICAgIFwiY29tcHV0ZXJcIixcbiAgICBcImFsZ2VicmFcIixcbiAgICBcInN5c3RlbVwiXG4gIF0sXG4gIFwibGljZW5zZVwiOiBcIkFwYWNoZS0yLjBcIixcbiAgXCJhdXRob3JcIjogXCJHcmF5c29uIENvcmRlbGxcIixcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiZmFzdC1qc29uLXN0cmluZ2lmeVwiOiBcIl42LjAuMFwiLFxuICAgIFwiZ2xvYmFsc1wiOiBcIl4xNS45LjBcIixcbiAgICBcIm1hdGhqc1wiOiBcIl4xMy4wLjNcIixcbiAgICBcIm11dGF0aXZlXCI6IFwiXjEuMC44XCJcbiAgfSxcbiAgXCJzaW1wbGUtZ2l0LWhvb2tzXCI6IHtcbiAgICBcInByZS1jb21taXRcIjogXCJwbnBtIGxpbnQtc3RhZ2VkXCJcbiAgfSxcbiAgXCJsaW50LXN0YWdlZFwiOiB7XG4gICAgXCIqXCI6IFwiZXNsaW50IC0tZml4XCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQGFudGZ1L2VzbGludC1jb25maWdcIjogXCJeMi4yNS4wXCIsXG4gICAgXCJAdHlwZXMvbm9kZVwiOiBcIl4yMi4xLjBcIixcbiAgICBcIkB0eXBlc2NyaXB0LWVzbGludC9lc2xpbnQtcGx1Z2luXCI6IFwiXjguMC4xXCIsXG4gICAgXCJAdHlwZXNjcmlwdC1lc2xpbnQvcGFyc2VyXCI6IFwiXjguMC4xXCIsXG4gICAgXCJAdml0ZXN0L2NvdmVyYWdlLXY4XCI6IFwiXjIuMC41XCIsXG4gICAgXCJAdnVlL3Rlc3QtdXRpbHNcIjogXCJeMi40LjZcIixcbiAgICBcImNhbWVsY2FzZVwiOiBcIl44LjAuMFwiLFxuICAgIFwiY3Jvc3MtZW52XCI6IFwiXjcuMC4zXCIsXG4gICAgXCJlc2xpbnRcIjogXCJeOS44LjBcIixcbiAgICBcImVzbGludC1wbHVnaW4tZm9ybWF0XCI6IFwiXjAuMS4yXCIsXG4gICAgXCJodHRwcy1sb2NhbGhvc3RcIjogXCJeNC43LjFcIixcbiAgICBcImpzZG9tXCI6IFwiXjI0LjEuMVwiLFxuICAgIFwibGludC1zdGFnZWRcIjogXCJeMTUuMi44XCIsXG4gICAgXCJwbnBtXCI6IFwiXjkuNy4wXCIsXG4gICAgXCJyb2xsdXBcIjogXCJeNC4yMC4wXCIsXG4gICAgXCJ0YXplXCI6IFwiXjAuMTYuM1wiLFxuICAgIFwidHlwZXNjcmlwdFwiOiBcIl41LjUuNFwiLFxuICAgIFwidml0ZVwiOiBcIl41LjQuMFwiLFxuICAgIFwidml0ZS1idW5kbGUtdmlzdWFsaXplclwiOiBcIl4xLjIuMVwiLFxuICAgIFwidml0ZS1wbHVnaW4tZHRzXCI6IFwiXjQuMC4xXCIsXG4gICAgXCJ2aXRlLXBsdWdpbi1pbnNwZWN0XCI6IFwiXjAuOC41XCIsXG4gICAgXCJ2aXRlc3RcIjogXCJeMi4wLjVcIixcbiAgICBcInZ1ZS10c2NcIjogXCJeMi4wLjI5XCJcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsZUFBZTtB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
