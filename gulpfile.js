"use strict";

const del          = require('del');
const gulp         = require('gulp');
const sass         = require('gulp-sass')(require('sass'));
const postcss      = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const sourcemaps   = require('gulp-sourcemaps');
const cleanCss     = require('gulp-clean-css');
const notify       = require('gulp-notify');
const htmllint     = require('gulp-htmllint');
const gutil        = require('gulp-util');
const gulpif       = require('gulp-if');
const minimist     = require('minimist');
const ejs          = require('gulp-ejs');
const rename       = require("gulp-rename");

const fs           = require('fs');
const cleanCssConfig = JSON.parse(fs.readFileSync('./config/cleanCss.config.json'));

/**********************************************
 *
 *
 *
 **********************************************/
const options = minimist(process.argv.slice(2), {
  string: 'env',
  default: {env: process.env.NODE_ENV || 'development'} // NODE_ENVに指定がなければ開発モードをデフォルトにする
});
const isProduction = (options.env === 'production');// $ gulp --env production

console.log('env is ' + options.env);

/**********************************************
 *
 *
 *
 **********************************************/
const baseDir = './docs/';
const _node_modules_dir = 'node_modules/';
const _htmlDir          = baseDir + '';
const _scssDir          = [
  'scss/**/*.scss',
  '!' + 'scss/xxx.scss'
];
const _cssDir       = baseDir + 'css/';
const componentsDir = baseDir + 'components/';

const htmlFiles = [
  _htmlDir + '**/*.html',
  '!' + _node_modules_dir + '**/*.html',
  '!' + componentsDir + '**/*.html'
];

let updateSourceTime;

/**********************************************
 *
 *
 *
 **********************************************/
function scss() {
  const startTime = Date.now();

  return gulp.src(_scssDir)
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded'
    }))
    .pipe(postcss([autoprefixer()]))
    // .pipe(cleanCss(cleanCssConfig))
    // .pipe(gulpif(isProduction, cleanCss()))
    .pipe(gulpif(!isProduction, sourcemaps.write('.')))
    // .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(_cssDir))
    .pipe(notify({
      onLast: true,
      title: "SCSS build is finished!",
      message: Date.now() - startTime + ' ms'
    }));
}

/**********************************************
 *
 *
 *
 **********************************************/
function removeHtml() {
  return del([
    _htmlDir + '**/*.html'
  ]);
}

/**********************************************
 *
 *
 *
 **********************************************/
function ejsBuild() {
  return gulp.src([
    "_ejs/**/*.ejs",
    "!_ejs/_inc/*.ejs"
  ])
    .pipe(ejs({}, {}, {
      "ext": ".html"
    }))
    .pipe(rename({ extname: ".html" }))
    .pipe(gulp.dest(baseDir));
}

/**********************************************
 *
 *
 *
 **********************************************/
function htmlLint() {
  gulp.src(htmlFiles)
    .pipe(htmllint({
      'config': 'config/.htmllintrc',
      // "plugins": ['htmllint-spellcheck'],
    }, htmllintReporter));
}

/**********************************************
 *
 *
 *
 **********************************************/
function htmllintReporter(filepath, issues) {
  if (issues.length > 0) {
    issues.forEach(function (issue) {
      let name = gutil.colors.red('[gulp-htmllint Error] ');
      let path = gutil.colors.white(filepath + ' [Line: ' + issue.line + ', ' + issue.column + ']: ');
      let message = issue.msg;
      let issueCode = gutil.colors.red('(' + issue.code + ') ');
      let errorMessage = name + path + issueCode + message;

      gutil.log(errorMessage);
    });

    // process.exitCode = 0;
    // process.exit(0);
  }
}

/**********************************************
 *
 *
 *
 **********************************************/
function watchFiles() {
  const scssWatcher = gulp.watch(
    _scssDir,
    gulp.parallel(scss));

  scssWatcher.on('change', function(path, stats) {
    console.log('scssWatcher: File ' + path + ' was changed');
  });


  // const htmlWatcher = gulp.watch(
  //   htmlFiles,
  //   gulp.parallel(htmlLint));
  //
  // htmlWatcher.on('change', function(path, stats) {
  //   console.log('htmlWatcher: File ' + path + ' was changed');
  // });


  // const ejsWatcher = gulp.watch(
  //   '_ejs/**/*.ejs',
  //   gulp.series(removeHtml, ejsBuild));
  //
  // ejsWatcher.on('change', function(path, stats) {
  //   console.log('File ' + path + ' was changed');
  // });
}

/**********************************************
 *
 *
 *
 **********************************************/
exports.default = gulp.series(scss, watchFiles);
exports.scss = scss;


// for ejs
// exports.default = gulp.series(scss, removeHtml, ejsBuild, watchFiles);
