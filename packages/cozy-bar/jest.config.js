module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/'
  },
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
    '^test/(.*)': '<rootDir>/test/$1',
    '^cozy-client$': '<rootDir>/node_modules/cozy-client/dist/index',
    '^cozy-client/dist/(.*)$': '<rootDir>/node_modules/cozy-client/dist/$1',
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom(.*)$': '<rootDir>/node_modules/react-dom$1'
  },
  transformIgnorePatterns: ['node_modules/(?!cozy-ui)']
}
