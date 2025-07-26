# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# TypeScript 5 Modern Decorator DI/IoC Framework

## Repository Architecture

This is a **Turbo monorepo** containing TypeScript 5 Modern Decorator-based frameworks:

- **`packages/inject/`** - Core dependency injection framework using TypeScript 5 Modern Decorators
- **`packages/express-controller/`** - Express controller framework with decorator-based routing and OpenAPI integration

## Package Structure & Dependencies

Both packages follow a consistent structure:
- `src/` - Source code with TypeScript 5 Modern Decorators (NOT experimental decorators)  
- `dist/` - Built output (CommonJS + ESM)
- `tests/` - Jest test files
- `docs/` - TypeDoc generated documentation
- `examples/` - Usage examples

Key dependency patterns:
- Uses **Modern Decorators** (TC39 Stage 3), not experimental decorators
- TypeScript 5.x with strict type checking enabled
- ESBuild for bundling both CommonJS and ESM outputs
- Jest with ts-jest for testing

## Development Commands

**Root level commands** (uses Turbo for orchestration):
```bash
npm run build     # Build all packages
npm run test      # Run tests in all packages  
npm run lint      # Lint all packages
npm run typecheck # Type check all packages
npm run dev       # Watch mode for development
```

**Package-specific commands** (run from package directories):
```bash
# Core inject package
cd packages/inject
npm run test:watch        # Jest watch mode
npm run test:coverage     # Coverage report
npm run docs             # Generate TypeDoc
npm run docs:serve       # Serve docs locally

# Express controller package  
cd packages/express-controller
npm run generate:api-types    # Generate OpenAPI types
npm run generate:helpers      # Generate type helpers
npm run generate             # Run both generators
```

## TypeScript Configuration

**Critical**: Uses Modern Decorators, not experimental ones:
```json
{
  "experimentalDecorators": false,
  "emitDecoratorMetadata": false,
  "target": "ES2022",
  "useDefineForClassFields": false
}
```

## Core Framework Patterns

### Inject Package
- **@Injectable()** decorator with scopes (singleton, prototype, transient)
- **@Inject()** for property injection using metadata keys
- **@PostConstruct/@PreDestroy** lifecycle hooks
- **Container** class for DI container management
- **createMetadataKey()** for type-safe injection tokens
- Fluent binding API: `container.bind(Service).to(Implementation).inSingletonScope()`

### Express Controller Package  
- **@Controller()** decorator for class-based controllers
- **@Get/@Post/@Put/@Delete()** route decorators
- **@Middleware()** for controller/route middleware
- **Response** classes (JsonResponse, FileResponse, etc.)
- OpenAPI integration with type generation
- CLI tool for project scaffolding

## Testing Strategy

- **Jest** with ts-jest preset
- Tests in `tests/` directories
- Coverage collection from `src/**/*.ts`
- Integration tests for container lifecycle
- Type-level tests for decorator metadata

## Key Files to Understand

- `packages/inject/src/container/Container.ts` - Main DI container implementation
- `packages/inject/src/metadata/decorators.ts` - Core decorator implementations  
- `packages/express-controller/src/decorators/` - Express route decorators
- `packages/express-controller/src/responses/` - Response abstraction system
- `tsconfig.base.json` - Shared TypeScript configuration

## Development Workflow

1. **Making changes**: Edit source in `src/`
2. **Testing**: Use `npm run test:watch` in package directory
3. **Building**: Run `npm run build` from root or package
4. **Type checking**: Run `npm run typecheck` to verify types
5. **Documentation**: Run `npm run docs` to generate/update docs

## Important Notes

- **Modern Decorators Only**: Do not use experimental decorators or emitDecoratorMetadata
- **Type Safety**: Use `createMetadataKey<T>()` for injection tokens instead of strings
- **Scopes**: Understand singleton vs prototype vs transient service lifecycles  
- **OpenAPI**: Express controller package auto-generates types from OpenAPI specs
- **Cleanup**: Always call `container.dispose()` for proper lifecycle management