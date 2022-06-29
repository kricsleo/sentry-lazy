import pkg from './package.json'
import commonjs from '@rollup/plugin-commonjs'
import rollupTypescript from 'rollup-plugin-typescript2'
import { uglify } from 'rollup-plugin-uglify'
import del from 'rollup-plugin-delete'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: `dist/${pkg.name}.global.js`,
      format: 'iife',
    },
    // {
    //   file: `dist/${pkg.name}.esm-bundler.js`,
    //   format: `es`,
    //   exports: 'auto'
    // },
    // {
    //   file: `dist/${pkg.name}.cjs.js`,
    //   format: `cjs`,
    //   exports: 'auto'
    // }
  ],
  plugins: [
    del({ targets: 'dist/*' }),
    rollupTypescript({
      useTsconfigDeclarationDir: true
    }),
    commonjs(),
    uglify(),
  ]
}