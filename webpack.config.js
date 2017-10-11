const path = require('path');
const webpack = require('webpack');
console.log(path.join(__dirname, 'src', 'templates', 'partials'))
module.exports = {
    entry: './src/index-cli.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ],
        loaders: [
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.hbs$/,
                loader: 'handlebars-loader',
                query: {
                    partialDirs: [
                        path.join(__dirname, 'src', 'templates', 'partials')
                    ],
                    debug: true
                }
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    output: {
        filename: 'index-cli.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new webpack.DefinePlugin({
            PACKAGE_NAME: JSON.stringify(require("./package.json").name),
            PACKAGE_VERSION: JSON.stringify(require("./package.json").version)
        })
    ],
    target: 'node'
};