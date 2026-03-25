// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  collectCoverage: false,
  collectCoverageFrom: ["./src/**/*.{ts,tsx}"],
  coverageDirectory: "./tests/coverage",
  coveragePathIgnorePatterns: ["./tests"],
  rootDir: "../",
  testMatch: ["./**/*.spec.{ts,tsx,js,jsx}"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = config;
