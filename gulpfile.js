import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import gulp from 'gulp';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import webpack from 'webpack-stream';
import wpConfig from './webpack.config.js';
import wpConfigDev from './webpack.dev.js';
import wpCompiler from 'webpack';
import { deleteAsync } from 'del';
import rename from 'gulp-rename';
import purgecss from '@fullhuman/postcss-purgecss';

const dest = {
    root: './dist/',
    css: './dist/css/',
    js: './dist/js/',
    jsDev: './src/js/',
    cssDev: './src/css/',
    fonts: './dist/fonts/',
    images: './dist/images/'
};
const src = {
    jsBsDev: './src/js/bootstrap.js',
    js: ['./src/js/main.js', './src/js/bootstrap.js'],
    jsMove: ['./src/js/*.min.js', './src/js/*.min.js.map', '!./src/js/bootstrap.bundle.min.js'],
    scss: './src/scss/style.scss',
    scssBs: './src/scss/custom.scss',
    css: './src/css/*.css',
    cssMove: ['./src/css/*.min.css', '!./src/css/bootstrap.min.css', '!./src/css/style.min.css'],
    htmlMove: './src/*.html',
    fontsMove: './src/fonts/**',
    imagesMove: './src/images/**',
};

const htmlStrReplacements = [
    { searchVal: /css\/custom.css/g, replacement: 'css/custom.min.css' },
    { searchVal: /css\/style.css/g, replacement: 'css/style.min.css' },
    { searchVal: /js\/bootstrap.dev.js/g, replacement: 'js/bootstrap.min.js' },
    { searchVal: /js\/bootstrap.js/g, replacement: 'js/bootstrap.min.js' },
    { searchVal: /js\/main.js/g, replacement: 'js/main.min.js' }
];

let pCss = false;

const sass = gulpSass(dartSass);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function replaceInFiles(files, replacements) {
    for (const file of files) {
        try {
            let content = await fs.promises.readFile(file, 'utf8');

            for (const item of replacements) {
                content = content.replace(item.searchVal, item.replacement);
            }

            await fs.promises.writeFile(file, content, 'utf8');
            console.log(`Updated: ${file}`);
        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }
}

export const updateHtmlLinks = () => {
    return (async () => {
        const files = [
            path.join(__dirname, 'dist/index.html')
        ];

        await replaceInFiles(files, htmlStrReplacements);
    })();
}

const pCssOn = (cb) => {
    pCss = true;
    cb();
}

export const clean = async () => {
    await deleteAsync(['dist/**']);
}

export const move = () => {
    gulp.src(src.jsMove)
        .pipe(gulp.dest(dest.js));
    gulp.src(src.cssMove)
        .pipe(gulp.dest(dest.css));
    gulp.src(src.htmlMove)
        .pipe(gulp.dest(dest.root));
    gulp.src(src.fontsMove, { encoding: false })
        .pipe(gulp.dest(dest.fonts));
    return gulp.src(src.imagesMove, { encoding: false })
        .pipe(gulp.dest(dest.images));
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
    const plugins = [autoprefixer(), cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })];
    pCss && plugins.push(purgecss({
        content: ['./src/**/*.html', './src/**/*.js', '!./src/js/bootstrap.bundle.min.js'],
        safelist: ['tooltip', 'tooltip-arrow', 'bs-tooltip-auto', 'tooltip-inner'],
        variables: true
    }));

    return gulp.src(src.css)
        .pipe(plumber())
        .pipe(rename(function (path) { path.basename += '.min' }))
        .pipe(postcss(plugins))
        .pipe(gulp.dest(dest.css));
};

export const wp = () => {
    return gulp.src(src.js)
        .pipe(plumber())
        .pipe(webpack(wpConfig, wpCompiler))
        .pipe(gulp.dest(dest.js));
};

export const wpDev = () => {
    return gulp.src('./src/js/bootstrap.js')
        .pipe(plumber())
        .pipe(webpack(wpConfigDev, wpCompiler))
        .pipe(gulp.dest('./src/js/'));
};

export const watch = () => {
    gulp.watch(['./src/scss/bootstrap.scss', './src/scss/custom.scss', './src/scss/_vars.scss',], scssBs);
    gulp.watch(['./src/scss/*', '!./src/scss/bootstrap.scss', '!./src/scss/custom.scss'], scss);
    gulp.watch(['./src/js/bootstrap.js'], wpDev);
};

export const dev = gulp.series(gulp.parallel(scss, scssBs, wpDev), watch);
export const build = gulp.series(clean, gulp.parallel(scss, scssBs, wp), gulp.parallel(move, postCss), updateHtmlLinks);
export const buildP = gulp.series(
    pCssOn,
    clean,
    gulp.parallel(scss, scssBs, wp),
    gulp.parallel(move, postCss),
    updateHtmlLinks
);

export default dev;
