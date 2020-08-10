module.exports = {
  entry: {
    'vc-js': './lib/index.js'
  },
  mode: 'production',
  output: {
    filename: '[name].min.js',
    library: 'VC',
    libraryTarget: 'umd'
  }
};
