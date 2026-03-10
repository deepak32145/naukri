module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  runInBand: true, // run tests serially (required for shared in-memory DB)
  verbose: true,
  setupFiles: ['<rootDir>/tests/setEnv.js'],
};
