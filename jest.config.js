// jest.config.js (ESM)
export default {
  testEnvironment: 'node',
  transform: {},

  // Alias @modules
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/frontend/js/modules/$1',
    '^@modules$': '<rootDir>/frontend/js/modules/index.js'
  },

  // Cobertura
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'frontend/js/modules/**/*.js',
    'frontend/js/ui/**/*.js',
    'frontend/js/network/**/*.js',
    '!**/index.js'
  ]
}
