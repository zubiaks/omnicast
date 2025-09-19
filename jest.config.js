// jest.config.js
export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/frontend/js/modules/$1'
  }
}
