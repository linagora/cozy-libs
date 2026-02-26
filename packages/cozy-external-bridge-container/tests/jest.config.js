// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  testEnvironment: 'jsdom',
  rootDir: '../',
  testMatch: ['./**/*.spec.{ts,tsx,js}']
}

module.exports = config
