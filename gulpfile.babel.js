import gulp from 'gulp';
import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import cssnano from 'cssnano';
import mqPacker from 'css-mqpacker';
import autoprefixer from 'autoprefixer';
import browserSync from 'browser-sync';

browserSync.create();

sass.compiler = require('dart-sass');

const postcssPlugins = [
    autoprefixer({ cascade: false }),
    mqPacker(),
    cssnano()
];

export const css = () => {
    return gulp.src('./assets/scss/styles.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(postcssPlugins))
        .pipe(gulp.dest('./assets/css'));
}

export const watchScss = () => {
    gulp.watch('./assets/scss/**/*.scss', css);
}

export const sync = () => {
    browserSync.init({
        port: 3002,
        server: {
            baseDir: './',
            index: "index.html"
        }
    });
}

export const watch = gulp.series(css, watchScss);

export default css;