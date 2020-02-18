import webpack from 'webpack'
import path from 'path';
import merge from 'webpack-merge'
import base from './webpack.base.config'
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import VueLoaderPlugin from 'vue-loader/lib/plugin';
import HTMLPlugin from 'html-webpack-plugin';
import dayjs from 'dayjs';
import { buildLocaleIgnorePattern } from './../i18n/helpers';

const isProd = process.env.NODE_ENV === 'production'

delete base.plugins
delete base.entry

const config = merge(base, {
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/](vue|vuex|vue-router|vue-meta|vue-i18n|vuex-router-sync|localforage)[\\/]/,
          name: 'vendor',
          chunks: 'all'
        }
      }
    },
    runtimeChunk: {
      name: 'manifest'
    }
  },
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
    new webpack.ContextReplacementPlugin(/dayjs[/\\]locale$/, buildLocaleIgnorePattern()),
    new webpack.ProgressPlugin(),
    new CaseSensitivePathsPlugin(),
    new VueLoaderPlugin(),
    // generate output HTML
    new HTMLPlugin({
      template: 'src/index.spa.template.html',
      filename: 'index.html',
      chunksSortMode: 'none',
      inject: isProd === false // in dev mode we're not using clientManifest therefore renderScripts() is returning empty string and we need to inject scripts using HTMLPlugin
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
  }
})

export default config;
