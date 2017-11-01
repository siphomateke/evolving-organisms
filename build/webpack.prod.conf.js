let utils = require('./utils');

let merge = require('webpack-merge');
let baseWebpackConfig = require('./webpack.base.conf');

let ExtractTextPlugin = require('extract-text-webpack-plugin');
let OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = merge(baseWebpackConfig, {
  plugins: [
    new ExtractTextPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin({
      cssProcessorOptions: {
        safe: true,
      },
    }),
  ],
});
