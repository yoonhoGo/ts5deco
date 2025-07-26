module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli/**/*', // CLI 관련 파일 제외
    '!src/lib/**/*', // 라이브러리/빌드 도구 제외
    '!src/types/generated/**/*', // 생성된 타입 파일 제외
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  testTimeout: 10000,
};