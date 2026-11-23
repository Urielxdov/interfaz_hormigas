/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  passWithNoTests: true,
  moduleNameMapper: {
    '^@hormigas/domain$': '<rootDir>/../domain',
    '^@hormigas/application$': '<rootDir>/../application',
  },
  transform: {
    '^.+\.ts$': ['ts-jest', { tsconfig: './tsconfig.jest.json' }],
  },
}
