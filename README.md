# ts5deco-inject

A modern Dependency Injection framework for TypeScript 5, built using the latest Modern Decorator API (TC39 Stage 3).

## 🚀 Features

- **Modern Decorators**: Uses TypeScript 5's Modern Decorator API (not experimental decorators)
- **Multiple Scopes**: Singleton, Prototype, and Transient service scopes
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Fluent API**: Intuitive fluent binding API for service registration
- **Circular Detection**: Automatic circular dependency detection and error reporting
- **Lifecycle Hooks**: @PostConstruct and @PreDestroy lifecycle management
- **Dual Module Support**: Both CommonJS and ESM module formats
- **Tree-shakable**: Optimized for modern bundlers
- **Well Tested**: Comprehensive test suite with 100+ tests

## 📦 Installation

```bash
npm install ts5deco-inject
```

## 🔧 Quick Start

```typescript
import { Container, Injectable, Inject, createMetadataKey } from 'ts5deco-inject';

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

## 📚 Documentation

For detailed documentation, examples, and API reference, see the [package README](./packages/inject/README.md).

## 🏗️ Project Structure

This is a Turbo monorepo containing:

- `packages/inject/` - The main dependency injection framework

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](./packages/inject/LICENSE) file for details.

## 🆘 Support

If you have any questions or issues, please open an issue on [GitHub](https://github.com/yoonhoGo/ts5deco/issues).