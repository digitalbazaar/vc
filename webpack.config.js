module.exports = {
  entry: {
    'vc-js': './lib/index.js'
  },
  externals: {
    'bitcore-message': '\'bitcore-message\''
  },
  mode: 'production',
  output: {
    filename: '[name].min.js',
    library: 'VC',
    libraryTarget: 'umd'
  }
};
