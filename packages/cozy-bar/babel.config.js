module.exports = {
  presets: [['cozy-app', { presetEnv: { modules: false } }]],
  env: {
    test: {
      presets: ['cozy-app']
    }
  },
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src']
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
