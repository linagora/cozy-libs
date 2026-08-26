// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  clearMocks: true,
  collectCoverage: false,
  collectCoverageFrom: ['./src/**/*.{ts,tsx}'],
  coverageDirectory: './tests/coverage',
  coveragePathIgnorePatterns: ['./tests'],
  rootDir: '../',
  testMatch: ['./**/*.spec.{ts,tsx,js,jsx}'],
  moduleNameMapper: {
    '\\.(styl|css)$': '<rootDir>/tests/styleMock.js',
    '\\.(png|jpe?g|gif|svg|webp)$': '<rootDir>/tests/fileMock.js'
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: [
    'node_modules/(?!(cozy-ui|@linagora/twake-icons)/)'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}

module.exports = config
