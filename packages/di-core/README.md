# @ts5deco/di-core

A modern Dependency Injection (DI) and Inversion of Control (IoC) framework for TypeScript 5, built using the latest Modern Decorator API (TC39 Stage 3).

## Features

- 🚀 **Modern Decorators**: Uses TypeScript 5's Modern Decorator API (not experimental decorators)
- 🔄 **Multiple Scopes**: Singleton, Prototype, and Transient service scopes
- 🎯 **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🏗️ **Fluent API**: Intuitive fluent binding API for service registration
- 🔍 **Circular Detection**: Automatic circular dependency detection and error reporting
- 🧬 **Lifecycle Hooks**: @PostConstruct and @PreDestroy lifecycle management
- 📦 **Dual Module Support**: Both CommonJS and ESM module formats
- 🌊 **Tree-shakable**: Optimized for modern bundlers
- 🧪 **Well Tested**: Comprehensive test suite with 88%+ coverage

## Installation

```bash
npm install @ts5deco/di-core
```

## Quick Start

```typescript
import { Container, Injectable, Inject, createMetadataKey } from '@ts5deco/di-core';

// Define a metadata key for type-safe injection
const DATABASE_URL = createMetadataKey<string>('database.url');

@Injectable()
class DatabaseService {
  @Inject(DATABASE_URL)
  private url!: string;

  connect() {
    console.log(`Connecting to ${this.url}`);
  }
}

@Injectable() 
class UserService {
  @Inject(DatabaseService)
  private db!: DatabaseService;

  getUser(id: string) {
    this.db.connect();
    return { id, name: 'John Doe' };
  }
}

// Create container and register services
const container = new Container();

container.register({
  type: 'value',
  token: DATABASE_URL,
  useValue: 'postgresql://localhost:5432/mydb'
});

container.register({
  type: 'class',
  token: DatabaseService,
  useClass: DatabaseService
});

container.register({
  type: 'class',
  token: UserService,
  useClass: UserService
});

// Resolve and use services
const userService = container.resolve(UserService);
const user = userService.getUser('123');
console.log(user); // { id: '123', name: 'John Doe' }
```

## Core Decorators

### @Injectable

Marks a class as injectable and specifies its scope:

```typescript
@Injectable('singleton') // Default scope
class ApiService {}

@Injectable('prototype') // New instance each time
class RequestHandler {}

@Injectable('transient') // Always create new instance
class TemporaryService {}
```

### @Inject

Injects dependencies into properties:

```typescript
@Injectable()
class OrderService {
  @Inject(PaymentService)
  private paymentService!: PaymentService;

  @Inject(LOGGER_TOKEN)
  private logger!: Logger;
}
```

### @PostConstruct

Defines initialization methods called after dependency injection:

```typescript
@Injectable()
class DatabaseConnection {
  @PostConstruct
  async initialize() {
    await this.connect();
    console.log('Database connected');
  }
}
```

### @PreDestroy

Defines cleanup methods called when the container is disposed:

```typescript
@Injectable()
class FileUploadService {
  @PreDestroy
  cleanup() {
    this.clearTempFiles();
    console.log('Cleanup completed');
  }
}
```

## Service Registration

### Class Providers

```typescript
container.register({
  type: 'class',
  token: UserService,
  useClass: UserService,
  scope: ServiceScope.SINGLETON
});
```

### Value Providers

```typescript
container.register({
  type: 'value',
  token: 'API_KEY',
  useValue: 'your-api-key-here'
});
```

### Factory Providers

```typescript
container.register({
  type: 'factory',
  token: 'HTTP_CLIENT',
  useFactory: (config: Config) => new HttpClient(config.baseUrl),
  deps: [CONFIG_TOKEN],
  scope: ServiceScope.SINGLETON
});
```

### Existing Providers (Aliases)

```typescript
container.register({
  type: 'existing', 
  token: 'USER_REPOSITORY',
  useExisting: UserService
});
```

## Fluent Binding API

For more readable service registration:

```typescript
// Bind to implementation
container.bind(UserService).to(UserServiceImpl).inSingletonScope();

// Bind to value
container.bind('API_URL').toValue('https://api.example.com');

// Bind to factory
container.bind('HTTP_CLIENT')
  .toFactory((config: Config) => new HttpClient(config))
  .withDependencies(CONFIG_TOKEN)
  .inSingletonScope();

// Bind to existing service
container.bind('USER_REPO').toExisting(UserService);

// Bind to self (when token is constructor)
container.bind(UserService).toSelf().inPrototypeScope();
```

## Service Scopes

### Singleton (Default)
- One instance per container
- Instance is cached and reused

```typescript
container.register({
  type: 'class',
  token: DatabaseService,
  useClass: DatabaseService,
  scope: ServiceScope.SINGLETON
});
```

### Prototype
- New instance on each resolution
- Dependencies are resolved each time

```typescript
container.register({
  type: 'class',
  token: RequestHandler,
  useClass: RequestHandler,
  scope: ServiceScope.PROTOTYPE
});
```

### Transient
- Always creates new instance
- Similar to prototype but with different semantic meaning

```typescript
container.register({
  type: 'class',
  token: TempService,
  useClass: TempService,
  scope: ServiceScope.TRANSIENT
});
```

## Child Containers

Create isolated scopes with inheritance:

```typescript
const parentContainer = new Container();
const childContainer = parentContainer.createChild();

// Child can access parent services
// Child services override parent services
```

## Container Options

```typescript
const container = new Container({
  defaultScope: ServiceScope.SINGLETON,
  autoBindInjectable: true,
  throwOnMissingDependencies: true,
  enableCaching: true,
  maxCacheSize: 1000
});
```

## Lifecycle Management

```typescript
@Injectable()
class ServiceWithLifecycle {
  @PostConstruct
  async initialize() {
    // Called after all dependencies are injected
    await this.setupConnections();
  }

  @PreDestroy
  async cleanup() {
    // Called when container is disposed
    await this.closeConnections();
  }
}

// Cleanup resources
await container.dispose();
```

## Error Handling

The framework provides specific error types:

```typescript
import { 
  ServiceNotFoundError,
  CircularDependencyError,
  InvalidProviderError 
} from '@ts5deco/di-core';

try {
  const service = container.resolve('unknown-service');
} catch (error) {
  if (error instanceof ServiceNotFoundError) {
    console.log('Service not registered');
  }
}
```

## Real-world Example

```typescript
import { Container, Injectable, Inject, createMetadataKey, PostConstruct } from '@ts5deco/di-core';

// Tokens
const CONFIG = createMetadataKey<AppConfig>('config');
const LOGGER = createMetadataKey<Logger>('logger');
const DATABASE = createMetadataKey<Database>('database');

// Configuration
interface AppConfig {
  port: number;
  dbUrl: string;
  logLevel: string;
}

// Logger service
interface Logger {
  info(message: string): void;
  error(message: string): void;
}

@Injectable()
class ConsoleLogger implements Logger {
  @Inject(CONFIG)
  private config!: AppConfig;

  info(message: string) {
    if (this.config.logLevel === 'info') {
      console.log(`[INFO] ${message}`);
    }
  }

  error(message: string) {
    console.error(`[ERROR] ${message}`);
  }
}

// Database service
interface Database {
  connect(): Promise<void>;
  query(sql: string): Promise<any[]>;
}

@Injectable()
class PostgresDatabase implements Database {
  @Inject(CONFIG)
  private config!: AppConfig;

  @Inject(LOGGER)
  private logger!: Logger;

  @PostConstruct
  async initialize() {
    await this.connect();
  }

  async connect() {
    this.logger.info(`Connecting to ${this.config.dbUrl}`);
    // Connection logic here
  }

  async query(sql: string) {
    this.logger.info(`Executing: ${sql}`);
    // Query logic here
    return [];
  }
}

// Business service
@Injectable()
class UserService {
  @Inject(DATABASE)
  private db!: Database;

  @Inject(LOGGER)
  private logger!: Logger;

  async getUser(id: string) {
    this.logger.info(`Fetching user ${id}`);
    return await this.db.query(`SELECT * FROM users WHERE id = $1`);
  }

  async createUser(userData: any) {
    this.logger.info(`Creating user ${userData.email}`);
    return await this.db.query(`INSERT INTO users ...`);
  }
}

// Setup container
const container = new Container();

const config: AppConfig = {
  port: 3000,
  dbUrl: 'postgresql://localhost:5432/myapp',
  logLevel: 'info'
};

container.register({
  type: 'value',
  token: CONFIG,
  useValue: config
});

container.bind(LOGGER).to(ConsoleLogger).inSingletonScope();
container.bind(DATABASE).to(PostgresDatabase).inSingletonScope();
container.bind(UserService).toSelf().inSingletonScope();

// Use the application
const userService = container.resolve(UserService);
const user = await userService.getUser('123');

// Cleanup when done
await container.dispose();
```

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false,
    "useDefineForClassFields": false
  }
}
```

## API Documentation

For complete API documentation, see the generated [TypeDoc documentation](./docs/).

## License

MIT License - see LICENSE file for details.