import { createRequire } from 'node:module'
import path from 'node:path'

import { defineConfig } from '@rspack/cli'
import rspack from '@rspack/core'

const rq = createRequire(import.meta.url)
const cozyStylus = rq('cozy-ui/stylus')
const processBrowserPath = rq.resolve('process/browser')
const reactPath = path.resolve(import.meta.dirname, 'node_modules/react')
const reactDomPath = path.resolve(import.meta.dirname, 'node_modules/react-dom')
const nmDir = path.resolve(import.meta.dirname, 'node_modules')
const cozyClientPath = path.resolve(nmDir, 'cozy-client')

// cozy-ui-plus nests its own copy of @material-ui/* under
// node_modules/cozy-ui-plus/node_modules/. Without deduplication the bundle
// contains two Mui instances, each with its own ThemeContext: CozyTheme (from
// cozy-ui-plus) provides its theme via one ThemeProvider, but the bar's Mui
// components (from cozy-ui) read the other ThemeContext — which has no provider,
// so they fall back to Mui's default Roboto typography. Force every
// @material-ui/* sub-package to the hoisted copy so a single ThemeContext is
// shared.
const muiPackages = [
  'core',
  'styles',
  'system',
  'utils',
  'lab',
  'pickers',
  'types'
]
const muiAliases = Object.fromEntries(
  muiPackages.map(pkg => [
    `@material-ui/${pkg}`,
    path.resolve(nmDir, `@material-ui/${pkg}`)
  ])
)

// Stylesheets are imported as strings to be injected in the bar shadow root
const cssAsString = { loader: 'css-loader', options: { exportType: 'string' } }

export default defineConfig({
  entry: './src/standalone/index.jsx',
  output: {
    filename: 'standalone.js',
    path: path.resolve(import.meta.dirname, 'dist')
  },
  mode: 'production',
  devtool: false,
  target: 'web',
  node: {
    global: true,
    __filename: false,
    __dirname: false
  },
  plugins: [
    new rspack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new rspack.ProvidePlugin({
      process: processBrowserPath
    })
  ],
  resolve: {
    modules: ['node_modules', path.resolve(import.meta.dirname, 'src')],
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      ...muiAliases,
      // Search is disabled in the standalone bar
      'cozy-search': false,
      'date-fns/locale$': path.resolve(
        import.meta.dirname,
        'src/standalone/dateFnsLocales.js'
      ),
      // Bundle a single copy: cozy-ui-plus requires the CommonJS build
      '@linagora/twake-icons$': path.resolve(
        path.dirname(rq.resolve('@linagora/twake-icons')),
        'index.js'
      ),
      'cozy-client/dist/types': path.resolve(
        import.meta.dirname,
        'node_modules/cozy-client/dist/types'
      ),
      'process/browser': processBrowserPath,
      react: reactPath,
      'react-dom': reactDomPath,
      'cozy-client': cozyClientPath
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
          cssAsString,
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
        use: [cssAsString]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset'
      }
    ]
  },
  performance: { hints: false }
})
