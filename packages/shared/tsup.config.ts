import { defineConfig } from 'tsup';

import { version as ternAuthUiVersion } from '../auth/package.json';
import { name, version } from './package.json';

export default defineConfig(() => {
  return {
    entry: [
      './src/*.{ts,tsx}',
      './src/react/index.ts',
      './src/utils/index.ts',
    ],
    bundle: true,
    minify: false,
    clean: true,
    sourcemap: true,
    format: ['cjs', 'esm'],
    dts: true,
    external: [
      'react',
      'react-dom'
    ],
    define: {
      PACKAGE_NAME: `"${name}"`,
      PACKAGE_VERSION: `"${version}"`,
      TERN_UI_VERSION: `"${ternAuthUiVersion}"`
    },
  };
});