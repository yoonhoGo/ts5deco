# AI Instructions for ts5deco-inject

## Library Overview
`ts5deco-inject` is a modern Dependency Injection framework for TypeScript 5, built using the latest Modern Decorator API (TC39 Stage 3). This library provides a clean, type-safe, and performant DI container for TypeScript applications.

## Key Features
- **Modern Decorators**: Uses TypeScript 5's Modern Decorator API (not experimental decorators)
- **Multiple Scopes**: Singleton, Prototype, and Transient service scopes
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Fluent API**: Intuitive fluent binding API for service registration
- **Circular Detection**: Automatic circular dependency detection and error reporting
- **Lifecycle Hooks**: @PostConstruct and @PreDestroy lifecycle management

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
  }
}
```

## Service Registration Patterns

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

// Bind to self
container.bind(UserService).toSelf().inPrototypeScope();
```

## Service Scopes

- **Singleton**: One instance per container (default)
- **Prototype**: New instance on each resolution
- **Transient**: Always creates new instance

## Metadata Keys
Use `createMetadataKey<T>()` for type-safe injection tokens:
```typescript
const DATABASE_URL = createMetadataKey<string>('database.url');
const LOGGER = createMetadataKey<Logger>('logger');
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

## Error Types
- `ServiceNotFoundError`: When a service is not registered
- `CircularDependencyError`: When circular dependencies are detected
- `InvalidProviderError`: When provider configuration is invalid

## TypeScript Configuration Requirements
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

## Installation
```bash
npm install ts5deco-inject
```

## Common Usage Pattern
```typescript
import { Container, Injectable, Inject, createMetadataKey } from 'ts5deco-inject';

// 1. Define tokens
const CONFIG = createMetadataKey<AppConfig>('config');

// 2. Create injectable services
@Injectable()
class UserService {
  @Inject(CONFIG)
  private config!: AppConfig;
}

// 3. Setup container
const container = new Container();

// 4. Register services
container.register({
  type: 'value',
  token: CONFIG,
  useValue: { /* config object */ }
});

container.bind(UserService).toSelf();

// 5. Resolve services
const userService = container.resolve(UserService);

// 6. Cleanup when done
await container.dispose();
```

## Best Practices for AI Code Generation

1. **Always use createMetadataKey()** for injection tokens instead of strings
2. **Prefer fluent API** for service registration when possible
3. **Use appropriate scopes** based on service lifecycle needs
4. **Include lifecycle hooks** (@PostConstruct, @PreDestroy) when services need initialization/cleanup
5. **Handle errors properly** using the provided error types
6. **Always call container.dispose()** for cleanup in applications
7. **Use child containers** for isolated scopes when needed

## Package Information
- **Package Name**: `ts5deco-inject`
- **Version**: 0.1.1
- **License**: MIT
- **Repository**: https://github.com/yoonhoGo/ts5deco
- **NPM**: https://www.npmjs.com/package/ts5deco-inject