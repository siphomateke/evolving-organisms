let webpack = require('webpack');
let webpackConfig = require('./webpack.dev.conf.js');

const compiler = webpack(webpackConfig);

const watching = compiler.watch({}, (err, stats) => {
  if (err) throw err;
});

module.exports = {
  close: () => {
    watching.close();
  },
};
