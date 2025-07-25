// Test file for Modern Decorator functionality

import { SampleService } from '../src/sample-decorator';

describe('Modern Decorator Tests', () => {
  let service: SampleService;

  beforeEach(() => {
    service = new SampleService();
  });

  it('should create service instance', () => {
    expect(service).toBeInstanceOf(SampleService);
  });

  it('should have default name from decorator', () => {
    expect(service.name).toBe('default name');
  });

  it('should call greet method', () => {
    const result = service.greet('World');
    expect(result).toBe('Hello, World!');
  });

  it('should call calculate method', () => {
    const result = service.calculate(5, 3);
    expect(result).toBe(8);
  });
});