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

const dest = {
    root: './dist/',
    css: './dist/css/',
    js: './dist/js/',
    jsDev: './src/js/',
    cssDev: './src/css/'
};
const src = {
    jsBsDev: './src/js/bootstrap.js',
    js: ['./src/js/main.js', './src/js/bootstrap.js'],
    scss: './src/scss/style.scss',
    scssBs: './src/scss/bootstrap.scss',
    css: './src/css/*.css',
};

const htmlStrReplacements = [
    { searchVal: /css\/bootstrap.css/g, replacement: 'css/bootstrap.min.css' },
    { searchVal: /css\/style.css/g, replacement: 'css/style.min.css' },
    { searchVal: /js\/bootstrap.dev.js/g, replacement: 'js/bootstrap.min.js' },
    { searchVal: /js\/main.js/g, replacement: 'js/main.min.js' }
];

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

export const clean = async () => {
    await deleteAsync(['dist/**']);
}

export const moveJs = () => {
    return gulp.src(['./src/js/*.min.js', './src/js/*.min.js.map'])
        .pipe(gulp.dest(dest.js));
}

export const moveCss = () => {
    return gulp.src(['./src/css/*.min.css', '!./src/css/bootstrap.min.css', '!./src/css/style.min.css'])
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
        cssnano({ preset: ['default', { discardComments: { removeAll: true } }] }),
    ];

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
    return gulp.src(src.js)
        .pipe(plumber())
        .pipe(webpack(wpConfigDev, wpCompiler))
        .pipe(gulp.dest(dest.jsDev));
};

export const watch = () => {
    gulp.watch('./src/bootstrapSCSS/*', scssBs);
    gulp.watch('./src/scss/*', scss);
    gulp.watch(['./src/js/*', '!./src/js/*.min.js'], wpDev);
};

export const dev = gulp.series(gulp.parallel(scss, scssBs, wpDev), watch);
export const move = gulp.parallel(moveJs, moveCss, moveHtml, moveFonts, moveImages);
export const build = gulp.series(gulp.parallel(scss, scssBs), clean, gulp.parallel(move, postCss, wp), updateHtmlLinks);

export default dev;
