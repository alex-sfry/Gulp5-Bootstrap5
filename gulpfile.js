import gulp from 'gulp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import postcssNested from 'postcss-nested';
import webpack from 'webpack-stream';
import wpConfig from './webpack.config.js';
import wpCompiler from 'webpack';
import { deleteAsync } from 'del';
import rename from 'gulp-rename';

let env = 'dev';

const dest = {
    root: './dist/',
    css: './dist/css/',
    js: './dist/js/',
    cssDev: './src/css/'
};
const src = {
    js: './src/js/main.js',
    scss: './src/scss/style.scss',
    scssBs: './src/scss/bootstrap.scss',
    css: './src/css/*.css',
};

const sass = gulpSass(dartSass);

export const envProd = () => {
    return Promise.resolve(env = 'prod');
}

export const clean = async () => {
    await deleteAsync(['dist/**']);
}

export const moveJs = () => {
    return gulp.src('./src/js/*.min.js')
        .pipe(gulp.dest(dest.js));
}

export const moveCss = () => {
    return gulp.src('./src/css/*.min.css')
        .pipe(gulp.dest(dest.css));
}

export const moveHtml = () => {
    return gulp.src('./src/*.html')
        .pipe(gulp.dest(dest.root));
}

export const moveFonts = () => {
    return gulp.src('./src/fonts/**', { encoding: false })
        .pipe(gulp.dest(`${dest.root}fonts/`));
}

export const moveImages = () => {
    return gulp.src('./src/images/**', { encoding: false })
        .pipe(gulp.dest(`${dest.root}images/`));
}

export const scssBs = () => {
    return gulp.src(src.scssBs)
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(dest.cssDev));
};

export const scss = () => {
    return gulp.src(src.scss)
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(dest.cssDev));
};

export const postCss = () => {
    const plugins = [
        autoprefixer(),
        postcssNested(),
        cssnano({ preset: ['default', { discardComments: { removeAll: true } }] }),
    ];

    return gulp.src(src.css)
        .pipe(plumber())
        .pipe(rename(function(path) {
             path.basename += '.min'
        }))
        .pipe(sourcemaps.init())
        .pipe(postcss(plugins))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(dest.css));
};

export const wp = () => {
    return gulp.src(src.js)
        .pipe(plumber())
        .pipe(webpack(wpConfig, wpCompiler))
        .pipe(gulp.dest(dest.js));
};

export const watch = () => {
    gulp.watch('./src/bootstrapSCSS/*', scssBs);
    gulp.watch('./src/scss/*', scss);
};

export const dev = gulp.series(gulp.parallel(scss, scssBs), watch);
export const move = gulp.parallel(moveJs, moveCss, moveHtml, moveFonts, moveImages);
export const build = gulp.series(clean, envProd, gulp.parallel(move, wp, postCss));

export default dev;
