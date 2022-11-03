export default [
  {
    input: 'src/index.js',
    external: id => /^(lib0|yaml)/.test(id),
    output: {
      name: 'LubbaEncoder',
      file: 'dist/lubba-encoder.cjs',
      format: 'cjs',
      sourcemap: true
    }
  }
]
