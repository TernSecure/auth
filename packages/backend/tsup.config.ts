import { defineConfig } from "tsup";
import type { Options } from "tsup";

import { name, version } from "./package.json";

const config: Options = {
  entry: ['src/index.ts', 'src/admin/index.ts', 'src/jwt/index.ts'],
  bundle: true,
  sourcemap: true,
  clean: true,
  minify: false,
  external: ['next', 'firebase-admin'],
  define: {
    PACKAGE_NAME: `"${name}"`,
    PACKAGE_VERSION: `"${version}"`,
  },
};

const esmConfig: Options = {
  ...config,
  format: "esm",
};

const cjsConfig: Options = {
  ...config,
  format: "cjs",
};

export default defineConfig([esmConfig, cjsConfig]);
