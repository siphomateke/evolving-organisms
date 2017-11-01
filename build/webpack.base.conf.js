let utils = require('./utils');
let CopyWebpackPlugin = require('copy-webpack-plugin');
let CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: './dist/bundle.js',
  },
  resolve: {
    alias: {
      'src': utils.resolve('./src'),
      'static': utils.resolve('./static'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['env'],
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [{
          loader: 'style-loader', // creates style nodes from JS strings
        }, {
          loader: 'css-loader', // translates CSS into CommonJS
        }, {
          loader: 'sass-loader', // compiles Sass to CSS
        }],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'img/[name].[hash:7].[ext]',
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'fonts/[name].[hash:7].[ext]',
        },
      },
    ],
  },
  plugins: [
    // Copy all the static files to the output folder
    new CopyWebpackPlugin([
      {
        from: utils.resolve('./static'),
        to: './dist/',
        /* ignore: ['.*'], */
      },
    ]),
    new CircularDependencyPlugin({
      // exclude detection of files based on a RegExp
      exclude: /a\.js|node_modules/,
      // add errors to webpack instead of warnings
      failOnError: true,
      // override `exclude` and `failOnError` behavior
      // `onDetected` is called for each module that is cyclical
      onDetected({paths, compilation}) {
        // `paths` will be an Array of the relative module paths that make up the cycle
        compilation.errors.push(new Error('Circular dependency: ' + paths.join(' -> ')));
      },
    }),
  ],
};
