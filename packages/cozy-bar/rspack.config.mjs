import { createRequire } from 'node:module'
import path from 'node:path'

import { defineConfig } from '@rspack/cli'

const rq = createRequire(import.meta.url)
const cozyStylus = rq('cozy-ui/stylus')

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
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      'cozy-client/dist/types': path.resolve(
        import.meta.dirname,
        'node_modules/cozy-client/dist/types'
      )
    },
    fallback: {
      path: false,
      fs: false,
      os: false,
      url: false,
      util: false,
      stream: false,
      buffer: false
    }
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
                use: [cozyStylus()],
                include: [cozyStylus.path]
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset'
      }
    ]
  },
  performance: { hints: false }
})
