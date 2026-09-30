const cssModulesOptions = {
  extensions: ['.styl'],
  preprocessCss: './preprocess',
  generateScopedName: '[name]__[local]___[hash:base64:5]'
}

module.exports = {
  presets: ['cozy-app'],
  env: {
    transpilation: {
      ignore: [
        '**/*.spec.jsx',
        '**/*.spec.js',
        '**/*.spec.tsx',
        '**/*.spec.ts'
      ],
      // Only the build writes the stylesheet, otherwise each babel-jest
      // worker overwrites it with the styles of its own test files
      plugins: [
        [
          'css-modules-transform',
          { ...cssModulesOptions, extractCss: './dist/stylesheet.css' }
        ]
      ]
    },
    test: {
      presets: [['cozy-app', { transformRuntime: { helpers: true } }]]
    }
  },
  plugins: [
    ['css-modules-transform', cssModulesOptions],
    ['inline-json-import', {}]
  ],
  ignore: ['examples/**/*', '**/*.md', '**/*.styl', '**/*.json', '**/*.snap']
}
