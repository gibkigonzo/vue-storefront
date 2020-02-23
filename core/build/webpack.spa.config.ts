import webpack from 'webpack'
import path from 'path';
import merge from 'webpack-merge'
import base from './webpack.base.config'
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import VueLoaderPlugin from 'vue-loader/lib/plugin';
import HTMLPlugin from 'html-webpack-plugin';
import dayjs from 'dayjs';
import { buildLocaleIgnorePattern } from './../i18n/helpers';
import SWPrecachePlugin from 'sw-precache-webpack-plugin';
import themeRoot from './theme-path';
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production'
const isSWBuild = process.env.SW_BUILD

delete base.plugins
delete base.entry

const productionConfig = isProd ? {
  mode: 'production',
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/](vue|vuex|vue-router|vue-meta|vue-i18n|vuex-router-sync|localforage)[\\/]/,
          name: 'vendor',
          chunks: 'all',
          enforce: true
        }
      }
    },
    runtimeChunk: {
      name: 'manifest'
    },
    minimize: true,
    minimizer: [new TerserPlugin(), new OptimizeCssAssetsPlugin(), new CompressionPlugin()]
  }
} : {}

const swConfig = isSWBuild ? {
  mode: 'production',
  target: 'web',
  entry: ['@babel/polyfill', './core/service-worker/index.js'],
  output: {
    publicPath: '/',
    filename: 'core-service-worker.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.VUE_ENV': '"client"'
    }),
    // auto generate service worker
    new SWPrecachePlugin({
      cacheId: 'vue-sfr',
      filename: 'service-worker.js',
      staticFileGlobsIgnorePatterns: [/\.map$/],
      staticFileGlobs: [
        'dist/**.*.js',
        'dist/**.*.json',
        'dist/**.*.css',
        'assets/**.*',
        'assets/ig/**.*',
        'index.html',
        '/'
      ],
      runtimeCaching: [
        {
          // eslint-disable-next-line no-useless-escape
          urlPattern: '^https://fonts\.googleapis\.com/', /** cache the html stub  */
          handler: 'cacheFirst'
        },
        {
          // eslint-disable-next-line no-useless-escape
          urlPattern: '^https://fonts\.gstatic\.com/', /** cache the html stub  */
          handler: 'cacheFirst'
        },
        {
          // eslint-disable-next-line no-useless-escape
          urlPattern: '^https://unpkg\.com/', /** cache the html stub  */
          handler: 'cacheFirst'
        },
        {
          urlPattern: '/pwa.html', /** cache the html stub  */
          handler: 'networkFirst'
        }, {
          urlPattern: '/', /** cache the html stub for homepage  */
          handler: 'networkFirst'
        },
        {
          urlPattern: '/p/*', /** cache the html stub  */
          handler: 'networkFirst'
        },
        {
          urlPattern: '/c/*', /** cache the html stub  */
          handler: 'networkFirst'
        },
        {
          urlPattern: '/img/(.*)',
          handler: 'fastest'
        },
        {
          urlPattern: /(http[s]?:\/\/)?(\/)?([^\/\s]+\/)?(api\/catalog\/)(.*)/g, // eslint-disable-line no-useless-escape
          handler: 'networkFirst'
        },
        {
          urlPattern: '/api/*',
          handler: 'networkFirst'
        }, {
          urlPattern: '/assets/logo.svg',
          handler: 'networkFirst'
        }, {
          urlPattern: '/index.html',
          handler: 'networkFirst'
        }, {
          urlPattern: '/assets/*',
          handler: 'fastest'
        }, {
          urlPattern: '/assets/ig/(.*)',
          handler: 'fastest'
        }, {
          urlPattern: '/dist/(.*)',
          handler: 'fastest'
        }, {
          urlPattern: '/*/*', /** this is new product URL format  */
          handler: 'networkFirst'
        },
        {
          urlPattern: '/*/*/*', /** this is new product URL format  */
          handler: 'networkFirst'
        },
        {
          urlPattern: '/*', /** this is new category URL format  */
          handler: 'networkFirst'
        }],
      'importScripts': ['/core-service-worker.js'] /* custom logic */
    })
  ]
} : {}

const config = merge(base, {
  mode: 'development',
  resolve: {
    alias: {
      'create-api': './create-api-client.js'
    }
  },
  entry: {
    app: ['@babel/polyfill', './core/spa-entry.ts']
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    new CopyWebpackPlugin([
      { from: themeRoot + '/assets', to: 'assets' }
    ]),
    new webpack.ContextReplacementPlugin(/dayjs[/\\]locale$/, buildLocaleIgnorePattern()),
    new webpack.ProgressPlugin(),
    new CaseSensitivePathsPlugin(),
    new VueLoaderPlugin(),
    // generate output HTML
    new HTMLPlugin({
      template: 'src/index.spa.template.html',
      filename: 'index.html',
      chunksSortMode: 'none',
      inject: true
    }),
    new webpack.DefinePlugin({
      'process.env.__APPVERSION__': JSON.stringify(require('../../package.json').version),
      'process.env.__BUILDTIME__': JSON.stringify(dayjs().format('YYYY-MM-DD HH:mm:ss')),
      'process.env.VUE_ENV': '"client"'
    })
  ],
  output: {
    path: path.resolve(__dirname, '../../dist'),
    publicPath: '/',
    filename: '[name].[hash].js'
  },
  ...productionConfig,
  ...swConfig
})

export default config;
