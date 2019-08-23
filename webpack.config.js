module.exports = {
  entry: {
    'vc-js': './lib/index.js'
  },
  externals: {
    'bitcore-lib': '\'bitcore-lib\''
  },
  output: {
    filename: '[name].min.js',
    library: 'VC',
    libraryTarget: 'umd'
  }
};
