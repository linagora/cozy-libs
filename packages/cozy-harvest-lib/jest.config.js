module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  roots: ['src'],
  resolver: 'jest-resolve-cached',
  testPathIgnorePatterns: ['node_modules', 'dist'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/'
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'styl'],
  moduleDirectories: ['src', 'node_modules'],
  moduleNameMapper: {
    '^cozy-logger$': 'cozy-logger/dist/index.js',
    '^cozy-client$': 'cozy-client/dist/index.js',
    '^cozy-keys-lib$': 'cozy-keys-lib/transpiled/index.js',
    '\\.(png|gif|jpe?g|svg|css)$': '<rootDir>/src/__mocks__/fileMock.js',
    // identity-obj-proxy module is installed by cozy-scripts
    '.styl$': 'identity-obj-proxy',
    '^cozy-ui$': '<rootDir>/node_modules/cozy-ui',
    '^uuid$': require.resolve('uuid'),
    '^nanoid$': require.resolve('nanoid')
  },
  transformIgnorePatterns: [
    'node_modules/(?!(cozy-ui|cozy-ui-plus|cozy-client|cozy-keys-lib))'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.js']
}
