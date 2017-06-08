const gulp = require('gulp')
const pug = require("gulp-pug")
const stylus = require('gulp-stylus')
const connect = require('gulp-connect')
const autoprefixer = require('gulp-autoprefixer');
const packager = require('electron-packager')
const rimraf = require('rimraf')
const rm = n => new Promise(r => rimraf(n, r))
const pkg = n => new Promise(r => packager(n, r))

gulp.task('build', function() {
  gulp.src([
    'node_modules/jquery/dist/jquery.js',
    'node_modules/three/build/three.js',
    'node_modules/tween.js/src/Tween.js',
    'node_modules/moment/min/moment-with-locales.js',
    'node_modules/handlebars/dist/handlebars.js',
    'node_modules/echarts/dist/echarts.js',
    'node_modules/d3/build/d3.js',
    'node_modules/requirejs/require.js',
  ]).pipe(gulp.dest('dist/lib'))

  gulp.src('src/tpl/*.pug')
    .pipe(pug())
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload())

  gulp.src('src/img/**/*')
    .pipe(gulp.dest('dist/img'))
    .pipe(connect.reload())

  gulp.src('src/styl/*.styl')
    .pipe(stylus())
    .pipe(autoprefixer({
      browsers: ['last 2 versions', '> 1%'],
      cascade: false
    }))
    .pipe(gulp.dest('dist/css'))
    .pipe(connect.reload())

  gulp.src('src/styl/*.css')
    .pipe(gulp.dest('dist/css'))
    .pipe(connect.reload())

  gulp.src('src/js/*')
    .pipe(gulp.dest('dist/js'))
    .pipe(connect.reload())

  gulp.src('src/font/*')
    .pipe(gulp.dest('dist/font'))
    .pipe(connect.reload())

  gulp.src('src/favicon.ico')
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload())
})

gulp.task('electron_build', function(){
  gulp.src('dist/**/*')
    .pipe(gulp.dest('electron/app'))

  gulp.src('src/electron/*')
    .pipe(gulp.dest('electron/app'))
})

gulp.task('pack', async function(){
  // "electron_pack": "electron-packager ./electron/ gb_show --platform=win32 --arch=ia32 --download.cache=./tmp --asar",
  await rm('electron/dist')
  await pkg({
    dir: 'electron/app',
    out: 'electron/dist',
    name: 'gb_show',
    platform: 'win32',
    arch: 'ia32',
    asar: true,
    electronVersion: '1.7.2',
    download: {
      cache: 'electron/tmp'
    }
  })
})

gulp.task('connect', function() {
  connect.server({
    root: 'dist',
    port: 2056,
    livereload: true
  })
})

gulp.task('watch', function(){
  gulp.watch('src/**', ['build'])
})

gulp.task('dev', ['build', 'connect', 'watch'])
gulp.task('electron', ['build', 'electron_build'])
gulp.task('electron_dev', ['electron', 'connect', 'watch'])
gulp.task('electron_pack', ['electron', 'pack'])

