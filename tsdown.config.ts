import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: 'src/index.ts',
    format: 'esm',
    dts: true,
    target: 'es2018',
    sourcemap: true,
    outExtensions: () => ({
      js: '.js',
      dts: '.d.ts',
    }),
  },
  {
    entry: 'src/inject.ts',
    format: 'esm',
    dts: true,
    target: 'es2018',
    sourcemap: true,
    outExtensions: () => ({
      js: '.js',
      dts: '.d.ts',
    }),
  },
  {
    entry: 'src/index.ts',
    format: 'iife',
    globalName: 'krolisLayout',
    dts: false,
    target: 'es2018',
    sourcemap: true,
  },
  {
    entry: 'src/inject.ts',
    format: 'iife',
    globalName: 'krolisLayoutInject',
    dts: false,
    target: 'es2018',
    sourcemap: true,
  },
]);
