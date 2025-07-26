// Jest 테스트 설정 파일
// 전역 설정이나 테스트 유틸리티 함수들을 정의

// TypeScript 5 Modern Decorator에서 Symbol 폴리필 (필요시)
if (!globalThis.Symbol) {
  globalThis.Symbol = Symbol;
}

// Console warnings를 테스트 중에는 무시하도록 설정 (필요시)
const originalWarn = console.warn;
beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  console.warn = originalWarn;
});