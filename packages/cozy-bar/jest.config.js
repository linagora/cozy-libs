module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'json', 'styl', 'yaml'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  setupFiles: ['<rootDir>/test/jestLib/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/test/jestLib/setupFilesAfterEnv.js'],
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '^config/(.*)': '<rootDir>/src/config/$1',
    '\\.(png|gif|jpe?g|svg)$': '<rootDir>/test/__mocks__/fileMock.js',
    '\\.styl$': 'identity-obj-proxy',
    '\\.css$': 'identity-obj-proxy',
    '^test/(.*)': '<rootDir>/test/$1'
  },
  browser: true,
  transformIgnorePatterns: ['node_modules/(?!cozy-ui)'],
  globals: {
    __ALLOW_HTTP__: false,
    __SENTRY_TOKEN__: 'token',
    __DEVELOPMENT__: false,
    __VERSION__: '4.5.0'
  }
}
