module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo(-.*)?|@expo(-.*)?|react-navigation|@react-navigation|@unimodules|unimodules|sentry-expo|native-base))',
  ],
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'services/**/*.ts',
    'services/**/*.tsx',
    'components/**/*.tsx',
    '!**/node_modules/**',
  ],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  globals: {
    __DEV__: true,
  },
};
