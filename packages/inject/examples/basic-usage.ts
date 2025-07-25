// Basic usage examples for @ts5deco/inject

import { Container, Injectable, Inject, PostConstruct, createMetadataKey } from '../src';

// Example 1: Basic Dependency Injection
console.log('=== Example 1: Basic Dependency Injection ===');

// Define metadata keys for type safety
const CONFIG_TOKEN = createMetadataKey<Config>('config');
const LOGGER_TOKEN = createMetadataKey<Logger>('logger');

interface Config {
  appName: string;
  version: string;
}

interface Logger {
  log(message: string): void;
}

@Injectable()
class ConsoleLogger implements Logger {
  @Inject(CONFIG_TOKEN)
  private config!: Config;

  log(message: string): void {
    console.log(`[${this.config.appName} v${this.config.version}] ${message}`);
  }
}

@Injectable()
class GreetingService {
  @Inject(LOGGER_TOKEN)
  private logger!: Logger;

  @PostConstruct
  initialize() {
    this.logger.log('GreetingService initialized');
  }

  greet(name: string): string {
    const message = `Hello, ${name}!`;
    this.logger.log(`Generated greeting: ${message}`);
    return message;
  }
}

// Setup container
const container = new Container();

// Register configuration
container.register({
  type: 'value',
  token: CONFIG_TOKEN,
  useValue: { appName: 'MyApp', version: '1.0.0' }
});

// Register services
container.register({
  type: 'class',
  token: LOGGER_TOKEN,
  useClass: ConsoleLogger
});

container.register({
  type: 'class',
  token: GreetingService,
  useClass: GreetingService
});

// Use the service
const greetingService = container.resolve(GreetingService);
const greeting = greetingService.greet('World');
console.log(`Result: ${greeting}\n`);

// Example 2: Fluent API
console.log('=== Example 2: Fluent API ===');

const fluentContainer = new Container();

// Register using fluent API
fluentContainer
  .bind('app.name')
  .toValue('FluentApp');

fluentContainer
  .bind('multiplier')
  .toFactory(() => Math.random() * 10)
  .inPrototypeScope(); // New value each time

fluentContainer
  .bind(GreetingService)
  .toSelf()
  .inSingletonScope();

// Use fluent-registered services
const appName = fluentContainer.resolve('app.name');
const multiplier1 = fluentContainer.resolve('multiplier');
const multiplier2 = fluentContainer.resolve('multiplier');

console.log(`App Name: ${appName}`);
console.log(`Multiplier 1: ${multiplier1}`);
console.log(`Multiplier 2: ${multiplier2}`);
console.log(`Different values: ${multiplier1 !== multiplier2}\n`);

// Example 3: Service Scopes
console.log('=== Example 3: Service Scopes ===');

@Injectable('singleton')
class SingletonService {
  constructor() {
    console.log('SingletonService created');
  }
  
  getId() { return Math.random(); }
}

@Injectable('prototype')
class PrototypeService {
  constructor() {
    console.log('PrototypeService created');
  }
  
  getId() { return Math.random(); }
}

const scopeContainer = new Container();

scopeContainer.register({
  type: 'class',
  token: SingletonService,
  useClass: SingletonService
});

scopeContainer.register({
  type: 'class',
  token: PrototypeService,
  useClass: PrototypeService
});

// Singleton - same instance
const singleton1 = scopeContainer.resolve(SingletonService);
const singleton2 = scopeContainer.resolve(SingletonService);
console.log(`Singleton same instance: ${singleton1 === singleton2}`);
console.log(`Singleton same ID: ${singleton1.getId() === singleton2.getId()}`);

// Prototype - different instances
const prototype1 = scopeContainer.resolve(PrototypeService);
const prototype2 = scopeContainer.resolve(PrototypeService);
console.log(`Prototype different instances: ${prototype1 !== prototype2}`);
console.log(`Prototype different IDs: ${prototype1.getId() !== prototype2.getId()}\n`);

// Cleanup
async function cleanup() {
  await container.dispose();
  await fluentContainer.dispose();
  await scopeContainer.dispose();
  console.log('All containers disposed');
}

cleanup();