module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  runInBand: true, // run tests serially (required for shared in-memory DB)
  verbose: true,
  setupFiles: ['<rootDir>/tests/setEnv.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',   // skip DB/cloudinary setup files
  ],
  coverageReporters: ['html', 'text-summary'],
  coverageDirectory: 'coverage',
};
