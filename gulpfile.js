import gulp from 'gulp';
import { webpackDev, webpackProd } from './gulpfileWebpack.js';
export { webpackDev, webpackProd } from './gulpfileWebpack.js';
import { bsStyles, bsStylesMin, purgeCSS } from './gulpfileStyles.js';
export { bsStyles, bsStylesMin, purgeCSS } from './gulpfileStyles.js';
import { webpackBsDev } from './gulpfileWebpack.js';
export { webpackBsDev } from './gulpfileWebpack.js';
import { webpackBsProd } from './gulpfileWebpack.js';
export { webpackBsProd } from './gulpfileWebpack.js';
import { vendorJS } from './gulpfileSripts.js';
export { vendorJS } from './gulpfileSripts.js';
import { vendorJSProd } from './gulpfileSripts.js';
export { vendorJSProd } from './gulpfileSripts.js';
import sync from 'browser-sync';
import { deleteAsync } from 'del';
import pug from 'gulp-pug';
import plumber from 'gulp-plumber';
import preprocess from 'gulp-preprocess';

const browserSync = sync.create('localServer');
let syncMode = false;
let prodMode = false;

const enableSync = () => Promise.resolve(syncMode = true);
const setModeProd = () => Promise.resolve(prodMode = true);

export const clean = async () => {
    return await deleteAsync(['./build/**/*', './templates/**/*']);
};

export const cleanTemplates = async () => {
    return await deleteAsync(['./templates/**/*']);
};

export const html = () => {
    const destPath = prodMode ? './build/' : './templates/';
    return gulp.src('./src/*.html')
        .pipe(preprocess({ context: { NODE_ENV: prodMode ? 'production' : 'development' } }))
        .pipe(gulp.dest(destPath))
        .pipe(browserSync.stream());
};

export const pugTask = () => {
    const destPath = prodMode ? './build/' : './templates/';
    return gulp.src('./src/*.pug')
        .pipe(plumber())
        .pipe(preprocess({ context: { NODE_ENV: prodMode ? 'production' : 'development' } }))
        .pipe(pug({
            locals: {
                mode: prodMode
            }
        }))
        .pipe(gulp.dest(destPath))
        .pipe(browserSync.stream());
};

export const watch = () => {
    console.log('syncMode - ', syncMode);

    gulp.watch('./src/**/*.pug', () => pugTask())
        .on('change', (path) => console.log(`File ${path} was changed`))
        .on('unlink', (path) => console.log(`File ${path} was removed`))
        .on('add', (path) => console.log(`File ${path} was added`));

    gulp.watch('./src/*.html', () => html())
        .on('change', (path) => console.log(`File ${path} was changed`))
        .on('unlink', (path) => console.log(`File ${path} was removed`))
        .on('add', (path) => console.log(`File ${path} was added`));

    gulp.watch('./src/images/**/*', () => webpackDev())
        .on('change', (path) => console.log(`File ${path} was changed`))
        .on('unlink', (path) => console.log(`File ${path} was removed`))
        .on('add', (path) => console.log(`File ${path} was added`));

    gulp.watch('./src/fonts/**/*', () => webpackDev())
        .on('change', (path) => console.log(`File ${path} was changed`))
        .on('unlink', (path) => console.log(`File ${path} was removed`))
        .on('add', (path) => console.log(`File ${path} was added`));

    gulp.watch('./src/vendorJS/**/*.js', () => vendorJS())
        .on('change', (path) => console.log(`File ${path} was changed`))
        .on('unlink', (path) => console.log(`File ${path} was removed`))
        .on('add', (path) => console.log(`File ${path} was added`));

    gulp.watch('./src/script/*.js', () => webpackDev())
        .on('change', (path) => console.log(`File ${path} was changed`))
        .on('unlink', (path) => console.log(`File ${path} was removed`))
        .on('add', (path) => console.log(`File ${path} was added`));

    gulp.watch(['./src/styles/**/*.scss', './src/styles/**/*.css'], () => webpackDev())
        .on('change', (path) => console.log(`File ${path} was changed`))
        .on('unlink', (path) => console.log(`File ${path} was removed`))
        .on('add', (path) => console.log(`File ${path} was added`));

    syncMode && browserSync.init({ server: { baseDir: "./templates/" } });
};

/* dev mode with browserSync */
export const devBs = gulp.series(
    enableSync,
    clean,
    gulp.parallel(pugTask, html, vendorJS, bsStyles, webpackBsDev),
    webpackDev,
    watch
);

/* dev mode w/o bootstrap with browserSync */
export const dev = gulp.series(
    enableSync,
    clean,
    gulp.parallel(pugTask, html, vendorJS),
    webpackDev, watch
);

/* compile and minify Bootstrap w/o purgeCSS */
export const bsProd = gulp.series(
    gulp.parallel(pugTask, html, vendorJSProd),
    gulp.parallel(webpackBsDev, webpackDev),
    gulp.parallel(bsStyles, webpackBsProd),
    bsStylesMin,
    webpackProd,
    cleanTemplates
);

/* minify everything (incl. Bootstrap) with purgeCSS */
export const buildPurge = gulp.series(
    setModeProd,
    clean,
    gulp.series(
        gulp.parallel(pugTask, html, vendorJSProd),
        gulp.parallel(webpackBsDev, webpackDev),
        gulp.parallel(bsStyles, webpackBsProd),
        purgeCSS,
        bsStylesMin,
        webpackProd,
        cleanTemplates
    )
);

export default devBs;
