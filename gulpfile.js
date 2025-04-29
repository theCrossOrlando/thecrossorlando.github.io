import gulp from 'gulp';
import { spawn } from 'child_process';
import concat from 'gulp-concat';
import htmlmin from 'gulp-htmlmin';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import terser from 'gulp-terser';
import postcss from 'gulp-postcss';
import purgecss from '@fullhuman/postcss-purgecss';
import cssnano from 'cssnano';
import removeComments from 'postcss-discard-comments';
import sourcemaps from 'gulp-sourcemaps';
import { default as log } from 'fancy-log';

// Dev
export const cssDev = () => gulp.src('./_css/style.scss')
    .pipe(sass({
      includePaths: [
        './_css',
        './node_modules/bootstrap/scss',
        './node_modules/@fontsource',
        './node_modules/@fortawesome/fontawesome-free/scss'
      ],
    })
    .on('error', sass.logError))
    .pipe(gulp.dest('./css'));

export const cssWatch = () => gulp.watch('./_css/**/*.scss', cssDev);

export const jsDev = () => gulp.src([
      './node_modules/bootstrap/dist/js/bootstrap.min.js',
      './node_modules/masonry-layout/dist/masonry.pkgd.min.js',
      './_js/script.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('script.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('js'));

export const lyricsJsDev = () => gulp.src([
      './node_modules/bootstrap/dist/js/bootstrap.min.js',
      './node_modules/masonry-layout/dist/masonry.pkgd.min.js',
      './_js/lyrics.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('lyrics.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('js'));

export const jsWatch = () => gulp.watch('./_js/**/*.js', jsDev);

export const htmlServe = () => {
  const eleventy = spawn('npx', ['@11ty/eleventy', '--serve']);

  const htmlLogger = function(buffer) {
    buffer.toString()
      .split(/\n/)
      .forEach(function(message) {
        log('11ty: ' + message);
      });
  };

  eleventy.stdout.on('data', htmlLogger);
  eleventy.stderr.on('data', htmlLogger);
};

// Prod
export const cssProd = () => gulp.src('./_css/style.scss')
    .pipe(sass({
      includePaths: [
        './_css',
        './node_modules/bootstrap/scss',
        './node_modules/@fontsource',
        './node_modules/@fortawesome/fontawesome-free/scss'
      ],
    })
    .on('error', sass.logError))
    .pipe(postcss([purgecss({
        content: [
          '_site/**/*.html',
        ]
      }),
      removeComments({ removeAll: true }),
      cssnano()
    ]))
    .pipe(gulp.dest('./_site/css'));

export const jsProd = () => gulp.src([
      './node_modules/bootstrap/dist/js/bootstrap.min.js',
      './node_modules/masonry-layout/dist/masonry.pkgd.min.js',
      './_js/script.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(terser({
      toplevel: true,
      format: {
        comments: false
      }
    }))
    .pipe(concat('script.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./_site/js'));

export const lyricsJsProd = () => gulp.src([
      './node_modules/bootstrap/dist/js/bootstrap.min.js',
      './node_modules/masonry-layout/dist/masonry.pkgd.min.js',
      './_js/lyrics.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('lyrics.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./_site/js'));

export const htmlBuild = (gulpCallback) => {
  const eleventy = spawn('npx', ['@11ty/eleventy']);

  const htmlLogger = function(buffer) {
    buffer.toString()
      .split(/\n/)
      .forEach(function(message) {
        log('11ty: ' + message);
      });
  };

  eleventy.stdout.on('data', htmlLogger);
  eleventy.stderr.on('data', htmlLogger);

  eleventy.on('exit', gulpCallback);
};

export const fonts = () => gulp.src([
    'node_modules/@fortawesome/fontawesome-free/webfonts/*',
    'node_modules/@fontsource/arvo/files/*-latin-400-normal.*',
    'node_modules/@fontsource/cardo/files/*-latin*-400-normal.*',
    'node_modules/@fontsource/roboto/files/*-latin*-400-normal.*',
  ], { encoding: false })
  .pipe(gulp.dest('./_site/webfonts'));

export const dev = gulp.series(fonts, cssDev, jsDev, lyricsJsDev, gulp.parallel(htmlServe, cssWatch, jsWatch));
export const build = gulp.series(fonts, htmlBuild, cssProd, jsProd, lyricsJsProd);

export default dev;
