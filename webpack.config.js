module.exports = {
  entry: {
    'vc-js': './lib/index.js'
  },
  output: {
    filename: '[name].min.js',
    library: 'VC',
    libraryTarget: 'umd'
  }
};
