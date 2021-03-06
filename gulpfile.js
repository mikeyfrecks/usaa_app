var buildDir = 'build-usaa';

//GENERAL MODULES
var gulp = require('gulp'),
    concat = require('gulp-concat'),
    changed = require('gulp-changed'),

    wrap = require('gulp-wrap'),
    replace = require('gulp-replace'),
    declare = require('gulp-declare'),
    handlebars = require('gulp-handlebars');

//CSS PROCESSING
var sass = require('gulp-sass'),
    minifyCSS = require('gulp-minify-css'),
    postcss = require('gulp-postcss'),
    mqpacker = require('css-mqpacker'),
    autoprefixer = require('autoprefixer');

var processors = [
  autoprefixer({ browsers: ['last 3 versions'] }),
  mqpacker
];

//HTML PROCESSING
var  htmlclean = require('gulp-htmlclean');

//JAVASCRIPT PROCESSING
var uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint');


gulp.task('handlebars', function(){
  gulp.src('templates/*.hbs')
    .pipe(handlebars())
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'UsaaApp.templates',
      noRedeclare: true, // Avoid duplicate declarations
    }))
    .pipe(uglify())
    .on('error', console.error.bind(console))
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('../'+buildDir));
});
gulp.task('sass', function () {

  sassProcessor(['sass/main.scss', 'sass/expanded.scss','sass/ie-fixes.scss','sass/editor-styles.scss'], '../'+buildDir+'/css');
/*
  gulp.src(['sass/main.scss', 'sass/expanded.scss','sass/ie-fixes.scss','sass/editor-styles.scss'])
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(minifyCSS({keepBreaks:false, keepSpecialComments: 0}))
    .pipe(gulp.dest('../'+buildDir+'/css'));
    */
});

function sassProcessor(blob, dest) {
  gulp.src(blob)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(minifyCSS({keepBreaks:false, keepSpecialComments: 0}))
    .pipe(gulp.dest(dest));
}

function htmlProcessor(blob, dest) {
  gulp.src(blob)
    .pipe(changed(dest))
    .pipe(htmlclean({}))
    .pipe(gulp.dest(dest));
}
function jsProcessor(blob, dest, newName) {
  gulp.src(blob)
  .pipe(uglify())
  .on('error', console.error.bind(console))
  .pipe(concat(newName))
  .pipe(gulp.dest(dest));
}

gulp.task('map_detail_module', function(){
  sassProcessor('map_detail_module/main.scss', '../'+buildDir+'/main_detail_module');
  htmlProcessor('map_detail_module/*.php', '../'+buildDir+'/main_detail_module')
  jsProcessor('map_detail_module/js/plugins/*.js', '../'+buildDir+'/main_detail_module', 'plugins.js');
  jsProcessor(['map_detail_module/js/functions/*.js', 'map_detail_module/js/main.js'], '../'+buildDir+'/main_detail_module', 'main.js');
});


gulp.task('templates',function(){

  gulp.src('templates/*.hbs')
    .pipe(htmlclean({}))

    .pipe(wrap(
      '<div id="template<%= file.relative %>" ><%= contents %></div>', { someVar: 'someVal'}))
    .pipe(replace('.hbs',''))
    .pipe(concat('include-templates.php'))
    .pipe(gulp.dest('../'+buildDir));
});



gulp.task('js', function () {
  gulp.src(['js/handlebars.js','js/plugins/*.js', 'js/site.js', 'js/modules/*.js'])
    .pipe(uglify())
    .on('error', console.error.bind(console))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('../'+buildDir+'/js'));

});

gulp.task('lint', function() {
  return gulp.src(['js/site.js', 'modules/*.js', 'js/inline-load.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});



gulp.task('templatecrush', function() {
  gulp.src(['*.php','*.html','!custom-module-functions.php'])
    .pipe(changed('../'+buildDir))
    .pipe(htmlclean({}))
    .pipe(gulp.dest('../'+buildDir));
});

//IMAGE PROCESSING
var pngcrush = require('imagemin-pngcrush'),
    svgstore = require('gulp-svgstore'),
    imagemin = require('gulp-imagemin');

gulp.task('svgstore', function () {
    return gulp
        .src('assets/svgs/*.svg')
        .pipe(imagemin())
        .pipe(svgstore({ inlineSvg: true }))
        .pipe(gulp.dest('../'+buildDir+'/assets'));
});

gulp.task('imgmin', function () {
  gulp.src('assets/imgs/**/*')
    .pipe(changed('../'+buildDir+'/assets/imgs'))
    .pipe(imagemin({interlaced: true, progressive: true,svgoPlugins: [{removeViewBox: false}],use: [pngcrush()]}))
    .pipe(gulp.dest('../'+buildDir+'/assets/imgs'));
});

//DUMPS
gulp.task('fontdump', function(){
  gulp.src('assets/fonts/**/*')
    .pipe(gulp.dest('../'+buildDir+'/assets/fonts'));
});

gulp.task('wpdump', function(){
  gulp.src(['style.css', 'screenshot.png'])
    .pipe(gulp.dest('../'+buildDir));
});

gulp.task('watch', function() {
    gulp.watch('js/**/*.js', ['js']);
    gulp.watch(['sass/**/*'], ['sass']);
    gulp.watch('assets/imgs/**/*', ['imgmin']);
    gulp.watch('assets/fonts/**/*', ['fontdump']);
    gulp.watch(['*.php', '*.html'], ['templatecrush']);
    gulp.watch(['style.css', 'screenshot.png'], ['wpdump']);
    gulp.watch(['assets/svgs/*.svg'], ['svgstore']);
    gulp.watch(['templates/*.hbs'], ['templates']);
    gulp.watch(['map_detail_module/**/*'], ['map_detail_module']);
});
gulp.task('build', [ 'js', 'imgmin', 'templatecrush', 'fontdump', 'wpdump','sass', 'svgstore', 'templates', 'map_detail_module']);
