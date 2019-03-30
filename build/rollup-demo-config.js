const serve = require('rollup-plugin-serve');
const { banner, resolve } = require('./helper');
const baseConfig = require('./rollup-base-config');

baseConfig.plugins.push(// Default options
  serve({
    open: true,
    contentBase: [
      'examples', 'dist',
    ],
    host: 'localhost',
    port: 3003,
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  })
);

module.exports = Object.assign(baseConfig, {
  input: resolve('examples/index.ts'),
  output: {
    file: 'index.js',
    format: 'iife',
    // name: _package.namespace,
    banner: banner,
  }
});
