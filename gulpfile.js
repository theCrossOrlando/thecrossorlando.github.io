import gulp from 'gulp';
import { spawn } from 'child_process';
import concat from 'gulp-concat';
import htmlmin from 'gulp-htmlmin';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import terser from 'gulp-terser';
import postcss from 'gulp-postcss';
import purgecss from '@fullhuman/postcss-purgecss';
import cssnano from 'cssnano';
import removeComments from 'postcss-discard-comments';
import { default as log } from 'fancy-log';

// Dev
export const cssDev = () => gulp.src('./_css/style.scss')
    .pipe(sass({
      includePaths: [
        './_css',
        './node_modules/bootstrap/scss',
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
    .pipe(concat('script.js'))
    .pipe(gulp.dest('js'));

export const jsWatch = () => gulp.watch('./_js/**/*.js', jsDev);

export const jekyllServe = () => {
  const jekyll = spawn('bundle', ['exec', 'jekyll', 'serve']);

  const jekyllLogger = function(buffer) {
    buffer.toString()
      .split(/\n/)
      .forEach(function(message) {
        log('Jekyll: ' + message);
      });
  };

  jekyll.stdout.on('data', jekyllLogger);
  jekyll.stderr.on('data', jekyllLogger);
}

export const dev = gulp.series(cssDev, jsDev, gulp.parallel(jekyllServe, cssWatch, jsWatch));

// Prod
export const cssProd = () => gulp.src('./_css/style.scss')
    .pipe(sass({
      includePaths: [
        './_css',
        './node_modules/bootstrap/scss',
        './node_modules/@fortawesome/fontawesome-free/scss'
      ],
    })
    .on('error', sass.logError))
    .pipe(postcss([purgecss({
        content: [
          '_site/index.html',
          '_site/care.html',
          '_site/gatherings.html',
          '_site/lyrics/index.html',
          '_site/messages/**/*.html',
          '_site/people.html',
          '_site/values.html',
          '_site/work.html',
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
    .pipe(terser({
      toplevel: true,
      format: {
        comments: false
      }
    }))
    .pipe(concat('script.js'))
    .pipe(gulp.dest('./_site/js'));

export const jekyll = (gulpCallback) => {
  const jekyll = spawn('bundle', ['exec', 'jekyll', 'build']);

  const jekyllLogger = function(buffer) {
    buffer.toString()
      .split(/\n/)
      .forEach(function(message) {
        log('Jekyll: ' + message);
      });
  };

  jekyll.stdout.on('data', jekyllLogger);
  jekyll.stderr.on('data', jekyllLogger);

  jekyll.on('exit', gulpCallback);
}

export const build = gulp.series(jekyll, cssProd, jsProd);

export default dev;
