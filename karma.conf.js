/*
 * Copyright (c) 2019 Digital Bazaar, Inc. All rights reserved.
 */
const webpack = require('webpack');
const path = require('path');

module.exports = function(config) {

  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],

    // list of files / patterns to load in the browser
    files: [
      'tests/*.spec.js'
    ],

    // list of files to exclude
    exclude: ['bin/*'],
    preprocessors: {
      'tests/*.js': ['webpack', 'babel', 'sourcemap']
    },

    webpack: {
      //mode: 'production',
      mode: 'development',
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: [
              /bin/,
              /node_modules\/(?!jsonld|crypto-ld)/
            ],
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
                plugins: [
                  '@babel/plugin-transform-modules-commonjs',
                  '@babel/plugin-transform-runtime',
                  "@babel/plugin-proposal-object-rest-spread"
                ]
              }
            }
          }
        ]
      },
      node: {
        Buffer: false,
        process: false,
        crypto: false, // this is so bitcore does not error in webpack bundle step
        setImmediate: false
      },
      resolve: {
        alias: {
          crypto: path.resolve(__dirname, 'tests/mocks/crypto')
        }
      },
      externals: {
        'bitcore-message': '\'bitcore-message\''
      }
    },
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    //reporters: ['progress'],
    reporters: ['mocha'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR ||
    //   config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any
    // file changes
    autoWatch: false,

    // start these browsers
    // browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    //browsers: ['ChromeHeadless', 'Chrome', 'Firefox', 'Safari'],
    browsers: ['ChromeHeadless'],

    customLaunchers: {
      IE9: {
        base: 'IE',
        'x-ua-compatible': 'IE=EmulateIE9'
      },
      IE8: {
        base: 'IE',
        'x-ua-compatible': 'IE=EmulateIE8'
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

  })
}
