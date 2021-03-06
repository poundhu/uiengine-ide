/* global __dirname, require, module*/

const webpack = require('webpack');
// const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const path = require('path');
const env = require('yargs').argv.env; // use --env with webpack 2
const pkg = require('./package.json');

let libraryName = pkg.name;

let outputFile, mode;

if (env === 'build') {
  mode = 'production';
  outputFile = 'index.min.js';
} else {
  mode = 'development';
  outputFile = 'index.js';
}

const config = {
  mode: mode,
  entry: __dirname + '/src/index.tsx',
  devtool: 'source-map',
  output: {
    path: __dirname + '/lib',
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'this'
  },
  module: {
    rules: [{
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader'
      },
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /(\.jsx|\.js)$/,
        loader: 'eslint-loader',
        exclude: /node_modules/,
        options: {
          fix: true
        }
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.less$/,
        use: [{
            loader: 'style-loader' // creates style nodes from JS strings
          },
          {
            loader: 'css-loader' // translates CSS into CommonJS
          },
          {
            loader: 'less-loader' // compiles Less to CSS
          }
        ]
      }
    ]
  },
  plugins: [
    // new MonacoWebpackPlugin(),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    })
  ],
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.json', '.js', '.ts', '.tsx']
  },
  externals: {
    react: {
      root: 'React',
      commonjs2: 'react',
      amd: 'react',
      commonjs: 'react'
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      amd: 'react-dom',
      commonjs: 'react-dom'
    },
    uiengine: {
      root: 'UIEngine',
      commonjs2: 'uiengine',
      amd: 'uiengine',
      commonjs: 'uiengine'
    }
  }
};

module.exports = config;
