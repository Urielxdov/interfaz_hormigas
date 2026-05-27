/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/schemas/__tests__/**/*.test.ts'],
  passWithNoTests: true,
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.jest.json',
    },
  },
}
