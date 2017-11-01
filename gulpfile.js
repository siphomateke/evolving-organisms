let gulp = require('gulp');
let webpack = require('webpack');
let webpackStream = require('webpack-stream');
let notifier = require('node-notifier');

gulp.task('webpack', function() {
  let webpackSuccess = true;
  return gulp.src('src/index.js')
    .pipe(webpackStream(require('./webpack.config.js'), webpack)
      .on('error', function(err) {
        console.log(err);
        webpackSuccess = false;
        this.emit('end');
      }))
    .pipe(gulp.dest('dist'))
    .on('end', () => {
      notifier.notify({
        'title': 'Webpack',
        'message': 'Compilation complete!',
        'sound': false,
        'wait': true,
        'appID': 'Gulp',
      });
    });
});

gulp.task('watch', ['webpack'], function() {
  gulp.watch(['src/**/*.js'], ['webpack']);
});
