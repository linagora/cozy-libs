import path from 'node:path'
import { createRequire } from 'node:module'

import { defineConfig } from '@rspack/cli'

const rq = createRequire(import.meta.url)

export default defineConfig({
  entry: './src/standalone.jsx',
  output: {
    filename: 'standalone.js',
    path: path.resolve(import.meta.dirname, 'dist')
  },
  mode: 'production',
  target: 'web',
  resolve: {
    modules: ['node_modules', path.resolve(import.meta.dirname, 'src')],
    extensions: ['.js', '.jsx', '.json']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { configFile: './babel.config.rspack.js' }
        }
      },
      {
        test: /\.styl$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'stylus-loader',
            options: {
              stylusOptions: {
                use: [rq('cozy-ui/stylus')]
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  performance: { hints: false }
})
