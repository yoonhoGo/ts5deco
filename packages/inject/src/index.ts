// TypeScript 5 Modern Decorator Dependency Injection Framework
// Main entry point

// Export sample decorator for testing
export { SampleService } from './sample-decorator';

// Export metadata system
export * from './metadata';
export * from './metadata/decorators';

// Export core types and interfaces
export * from './types';
export * from './types/advanced';
export * from './types/constants';

// Export container implementation
export * from './container';

console.log('Inject Package loaded successfully');