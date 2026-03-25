const pkg = require('./package.json')

module.exports = {
  presets: ['cozy-app'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src']
      }
    ],
    [
      'transform-define',
      {
        __VERSION__: JSON.stringify(pkg.version),
        'typeof window': 'object'
      }
    ],
    [
      'css-modules-transform',
      {
        extensions: ['.styl'],
        preprocessCss: './preprocess',
        extractCss: './dist/stylesheet.css',
        generateScopedName: '[local]'
      }
    ]
  ]
}
