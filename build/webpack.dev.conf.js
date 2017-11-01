let utils = require('./utils');
let webpack = require('webpack');

let merge = require('webpack-merge');
let baseWebpackConfig = require('./webpack.base.conf');

let FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

module.exports = merge(baseWebpackConfig, {
  devServer: {
    quiet: true,
    open: true,
    openPage: './dist/index.html',
  },
  devtool: 'eval-source-map',
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new FriendlyErrorsWebpackPlugin(),
  ],
});
