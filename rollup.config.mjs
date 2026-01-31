import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/index.iife.js',
        format: 'iife',
        sourcemap: true,
        name: '@krolis/layout',
      },
      {
        file: 'dist/index.iife.min.js',
        format: 'iife',
        sourcemap: true,
        name: '@krolis/layout',
        plugins: [
          terser(),
        ],
      },
    ],
    plugins: [
      nodeResolve({ preferBuiltins: false }),
      commonjs(),
      typescript({
        declaration: false,
        target: "ES2018",
      }),
      json(),
    ],
  },
  // 归并 .d.ts 文件
  {
    input: 'types/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [
      // 将类型文件全部集中到一个文件中
      dts(),
    ],
  },
];
