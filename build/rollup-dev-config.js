const { _package, banner } = require('./helper');
const baseConfig = require('./rollup-base-config');

module.exports = Object.assign(baseConfig, {
  output: [
    {
      file: _package.main,
      format: 'umd',
      name: _package.namespace,
      banner: banner,
      globals: {
        'ol': 'ol'
      }
    },
    {
      file: _package.commonjs,
      format: 'cjs',
      banner: banner,
      globals: {
        'ol': 'ol'
      }
    },
    {
      file: _package.module,
      format: 'es',
      banner: banner,
      globals: {
        'ol': 'ol'
      }
    }
  ]
});
