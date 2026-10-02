module.exports = {
  testPathIgnorePatterns: ['node_modules', 'dist'],
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/'
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'styl', 'ts', 'tsx'],
  moduleDirectories: ['src', 'node_modules'],
  moduleNameMapper: {
    '\\.(png|gif|jpe?g|svg)$': '<rootDir>/test/__mocks__/fileMock.js',
    '\\.styl$': 'identity-obj-proxy',
    // react-pdf needs react/jsx-runtime, missing from the monorepo's React 16.12
    '^react-pdf$': '<rootDir>/test/__mocks__/react-pdf.js',
    '^cozy-client/src/(.*)$': '<rootDir>/node_modules/cozy-client/dist/$1',
    '^cozy-client$': '<rootDir>/node_modules/cozy-client/dist/index',
    '^cozy-client/dist/(.*)$': '<rootDir>/node_modules/cozy-client/dist/$1',
    '^cozy-ui/transpiled/react/providers/I18n$':
      '<rootDir>/test/__mocks__/twake-i18n.js',
    '^cozy-ui/transpiled/react/(.*)$':
      '<rootDir>/node_modules/cozy-ui/transpiled/react/$1',
    '^cozy-flags$': '<rootDir>/test/__mocks__/cozyFlagsMock.js',
    '^cozy-intent$': '<rootDir>/test/__mocks__/cozy-intent.js',
    '^cozy-sharing$': '<rootDir>/test/__mocks__/cozy-sharing.js',
    '^twake-i18n$': '<rootDir>/test/__mocks__/twake-i18n.js'
  },
  transformIgnorePatterns: ['node_modules/(?!(cozy-ui|cozy-ui-plus))'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)?$': 'babel-jest'
  }
}
