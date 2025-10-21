import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    mode: 'development',
    entry: {
        bootstrap: './src/js/bootstrap.js',
    },
    output: {
        publicPath: '/',
        filename: '[name].dev.js',
    },
    resolve: {
        extensions: ['.js']
    },
    optimization: {
        usedExports: true,
        minimize: true,
    },
    plugins: [
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: { presets: ['@babel/preset-env'] }
                }
            },
        ],
    },
    performance: {
        maxEntrypointSize: 1024000,
        maxAssetSize: 1024000
    }
};