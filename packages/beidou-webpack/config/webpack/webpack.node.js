'use strict';

// Webpack config for node

const webpack = require('webpack');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const common = require('./webpack.common');
const {
  imageLoaderConfig,
  fileLoaderConfig,
  getStyleCongfigs,
  ExtractTextPlugin,
} = require('./utils');

module.exports = (app, entry, dev) => {
  common(app, entry, dev);
  app.webpackFactory.get('output').libraryTarget = 'commonjs';
  app.webpackFactory.set('target', 'node');
  app.webpackFactory.set('externals', /^react(-dom)?$/);
  app.webpackFactory.set('node', {
    __filename: true,
    __dirname: true,
  });

  [
    {
      test: /\.(js|jsx|mjs)$/,
      exclude: /node_modules/,
      use: {
        loader: require.resolve('babel-loader'),
        options: {
          babelrc: false,
          presets: [require.resolve('babel-preset-beidou-server')],
          // This is a feature of `babel-loader` for webpack (not Babel itself).
          // It enables caching results in ./node_modules/.cache/babel-loader/
          // directory for faster rebuilds.
          cacheDirectory: true,
          highlightCode: true,
        },
      },
    },
    ...getStyleCongfigs(dev),
    imageLoaderConfig,
    fileLoaderConfig,
  ].forEach((v) => {
    app.webpackFactory.defineRule(v).addRule(v);
  });

  app.webpackFactory
    .definePlugin(ExtractTextPlugin, '[name].css', 'ExtractTextPlugin')
    .addPlugin('ExtractTextPlugin')
    .definePlugin(webpack.optimize.CommonsChunkPlugin, {
      name: 'manifest',
      filename: 'manifest.js',
    }, 'CommonsChunkPlugin')
    .addPlugin('CommonsChunkPlugin');

  app.webpackFactory.definePlugin(
    webpack.DefinePlugin, {
      'process.env.NODE_ENV': JSON.stringify('production'),
      __CLIENT__: false,
      __DEV__: false,
      __SERVER__: true,
    }, 'DefinePlugin');

  if (!dev) {
    app.webpackFactory.addPlugin('DefinePlugin');
    app.webpackFactory.addPlugin(MinifyPlugin, null, 'MinifyPlugin');
  } else {
    app.webpackFactory.addPlugin(webpack.NamedModulesPlugin, null, 'NamedModulesPlugin');
    app.webpackFactory.setPlugin(
      webpack.DefinePlugin, {
        'process.env.NODE_ENV': JSON.stringify('development'),
        __CLIENT__: false,
        __DEV__: true,
        __SERVER__: true,
      }, 'DefinePlugin');
  }
  return app.webpackFactory.getConfig();
};
