// Sample Modern Decorator implementation to test TypeScript 5 configuration

// Modern Decorator function that logs method calls
function logMethod(originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name);
  
  function replacementMethod(this: any, ...args: any[]) {
    console.log(`Calling method ${methodName} with arguments:`, args);
    const result = originalMethod.call(this, ...args);
    console.log(`Method ${methodName} returned:`, result);
    return result;
  }
  
  return replacementMethod;
}

// Class property decorator for testing
function defaultValue(value: any) {
  return function (initialValue: any, context: ClassFieldDecoratorContext) {
    return function (this: any) {
      return value;
    };
  };
}

// Test class using Modern Decorators
export class SampleService {
  @defaultValue('default name')
  name: string = '';

  @logMethod
  greet(message: string): string {
    return `Hello, ${message}!`;
  }

  @logMethod
  calculate(a: number, b: number): number {
    return a + b;
  }
}