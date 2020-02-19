import path from 'path';
import merge from 'webpack-merge';
import baseClientConfig from './webpack.client.config';
import TerserJSPlugin from 'terser-webpack-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';

const themeRoot = require('./theme-path');

const extendedConfig = require(path.join(themeRoot, '/webpack.config.js'))

const prodClientConfig = merge(baseClientConfig, {
  mode: 'production',
  devtool: 'nosources-source-map',
  plugins: [
  ],
  optimization: {
    minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})]
  }
})

module.exports = extendedConfig(prodClientConfig, {
  isClient: true,
  isDev: false
})
