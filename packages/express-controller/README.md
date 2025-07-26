# ts5deco Express Controller Framework

Modern TypeScript 5 Decorator-based Express Controller Framework

## Features

- 🎯 **Modern Decorators**: Uses TypeScript 5 modern decorators (not legacy experimental decorators)
- 🚀 **Express Integration**: Seamless integration with Express.js
- 🔧 **Type Safety**: Full TypeScript support with strong typing
- 🎨 **Clean Architecture**: Decorator-based controller definition
- 🛡️ **Middleware Support**: Built-in middleware support
- 🔄 **Auto Registration**: Automatic route registration
- 🚫 **No reflect-metadata**: Uses native WeakMap-based metadata storage
- ✨ **Type-Safe Responses**: Generic response classes with compile-time type checking
- 🎭 **Response System**: JsonResponse, TextResponse, NoContentResponse, RedirectResponse, and FileResponse

## Installation

```bash
npm install ts5deco-express-controller
# or
yarn add ts5deco-express-controller
# or
pnpm add ts5deco-express-controller
```

## Quick Start

### 1. Configure TypeScript

Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "experimentalDecorators": false,
    "emitDecoratorMetadata": false,
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs"
  }
}
```

### 2. Create a Controller

```typescript
import express from 'express';
import { Controller, Get, Post } from 'ts5deco-express-controller';

interface CreateUserDto {
  name: string;
  email: string;
}

@Controller('/users')
export class UserController {
  @Get()
  async getAllUsers(req: express.Request, res: express.Response, next: express.NextFunction) {
    const page = req.query.page as string || '1';
    // Get all users with optional pagination
    return { users: [], page };
  }

  @Get('/:id')
  async getUserById(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    // Get user by ID
    return { id, name: 'John Doe', email: 'john@example.com' };
  }

  @Post()
  async createUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const userData = req.body as CreateUserDto;
    // Create new user
    return { id: '123', ...userData };
  }
}
```

### 3. Register Controllers

```typescript
import express from 'express';
import { registerControllers } from 'ts5deco-express-controller';
import { UserController } from './controllers/user.controller';

const app = express();

// Middleware
app.use(express.json());

// Register controllers
registerControllers(app, [UserController], '/api');

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## API Reference

### Decorators

#### `@Controller(path?, options?)`

Defines a controller class.

```typescript
@Controller('/api/users')
export class UserController {
  // ...
}

// With middleware
@Controller({ 
  path: '/api/users', 
  middlewares: [authMiddleware] 
})
export class UserController {
  // ...
}
```

#### Route Decorators

- `@Get(path?, options?)` - GET requests
- `@Post(path?, options?)` - POST requests
- `@Put(path?, options?)` - PUT requests
- `@Delete(path?, options?)` - DELETE requests
- `@Patch(path?, options?)` - PATCH requests
- `@Head(path?, options?)` - HEAD requests
- `@Options(path?, options?)` - OPTIONS requests
- `@All(path?, options?)` - All HTTP methods

All route handlers receive Express's standard `req`, `res`, and `next` parameters:

```typescript
@Get('/profile')
async getProfile(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Access query parameters: req.query
  // Access URL parameters: req.params
  // Access request body: req.body
  // Access headers: req.headers
  return { profile: 'data' };
}

@Post({ path: '/users', middlewares: [validateUser] })
async createUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userData = req.body;
  return { user: userData };
}
```

#### Middleware Decorators

- `@Use(...middlewares)` - Apply middleware to route
- `@Authenticated(middleware)` - Authentication middleware
- `@Authorized(middleware)` - Authorization middleware
- `@Validated(middleware)` - Validation middleware

```typescript
@Use(loggingMiddleware, rateLimitMiddleware)
@Get('/protected')
async getProtectedData() {
  // ...
}

@Authenticated(jwtAuthMiddleware)
@Get('/profile')
async getProfile() {
  // ...
}
```

### Functions

#### `createRouter(controllers)`

Creates an Express router from controllers.

```typescript
import { createRouter } from 'ts5deco-express-controller';

const router = createRouter([UserController, PostController]);
app.use('/api', router);
```

#### `registerControllers(app, controllers, basePath?)`

Registers controllers directly to an Express app.

```typescript
import { registerControllers } from 'ts5deco-express-controller';

registerControllers(app, [UserController, PostController], '/api');
```

#### `registerController(router, controller)`

Registers a single controller to a router.

```typescript
import { registerController } from 'ts5deco-express-controller';

const router = express.Router();
registerController(router, UserController);
```

## Response System

The framework provides a powerful type-safe response system that eliminates repetitive `res.status().json()` boilerplate code.

### Basic Usage

```typescript
import { 
  JsonResponse, 
  JsonResponses,
  TextResponse,
  TextResponses,
  NoContentResponse,
  RedirectResponse,
  FileResponse
} from 'ts5deco-express-controller';

@Controller('/api/users')
export class UserController {
  
  // Type-safe JSON responses
  @Get('/')
  async getUsers(): Promise<JsonResponse<User[], 200>> {
    const users = await this.userService.getUsers();
    return new JsonResponse<User[], 200>(200, users);
  }

  @Get('/:id')
  async getUserById(req: Request): Promise<JsonResponse<User, 200> | JsonResponse<ErrorResponse, 404>> {
    const user = await this.userService.findById(req.params.id);
    
    if (!user) {
      return JsonResponses.notFound<ErrorResponse>({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }
    
    return JsonResponses.ok<User>(user);
  }

  @Post('/')
  async createUser(req: Request): Promise<JsonResponse<User, 201>> {
    const user = await this.userService.create(req.body);
    return JsonResponses.created<User>(user);
  }

  @Delete('/:id')
  async deleteUser(): Promise<NoContentResponse> {
    await this.userService.delete(req.params.id);
    return new NoContentResponse(); // 204 No Content
  }

  // Text responses with literal types
  @Get('/health')
  async healthCheck(): Promise<TextResponse<'healthy', 200>> {
    return new TextResponse<'healthy', 200>(200, 'healthy');
  }

  // Redirects
  @Get('/old-endpoint')
  async oldEndpoint(): Promise<RedirectResponse> {
    return new RedirectResponse('/api/users', 301); // Permanent redirect
  }

  // File downloads
  @Get('/export')
  async exportUsers(): Promise<FileResponse> {
    return new FileResponse('/tmp/users.csv', 'users-export.csv', true);
  }
}
```

### Response Types

#### JsonResponse<TData, TStatus>

Type-safe JSON responses with generics for data and status code:

```typescript
// Direct usage
return new JsonResponse<User, 200>(200, user);

// Convenience methods
return JsonResponses.ok<User>(user);           // 200 OK
return JsonResponses.created<User>(user);      // 201 Created
return JsonResponses.badRequest<Error>(error); // 400 Bad Request
return JsonResponses.notFound<Error>(error);   // 404 Not Found
```

#### TextResponse<TText, TStatus>

Type-safe text responses:

```typescript
// With literal types
return new TextResponse<'OK', 200>(200, 'OK');

// With template literal types
return new TextResponse<`v${string}`, 200>(200, 'v1.2.3');

// With union types
return new TextResponse<'running' | 'stopped', 200>(200, 'running');

// Convenience methods
return TextResponses.ok('Service is healthy');
```

#### Other Response Types

```typescript
// 204 No Content
return new NoContentResponse();

// Redirects
return new RedirectResponse('/new-path', 302);
return RedirectResponses.permanent('/new-path'); // 301
return RedirectResponses.temporary('/new-path'); // 302

// File responses
return new FileResponse('/path/to/file.pdf', 'document.pdf');
return FileResponses.attachment('/path/to/file.zip', 'archive.zip');
```

### Benefits

- **Type Safety**: Compile-time checking of response data and status codes
- **Clean Code**: No more repetitive `res.status().json()` calls
- **Consistency**: Standardized response handling across your application
- **IDE Support**: Full IntelliSense and auto-completion
- **Backward Compatible**: Works alongside existing Express response methods

For complete documentation, see [Response System Documentation](./docs/RESPONSE-SYSTEM.md).

## Examples

### Complete Example

```typescript
import express from 'express';
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete,
  Use,
  Authenticated,
  registerControllers 
} from 'ts5deco-express-controller';

// Middleware functions
const loggingMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Simple token validation (use JWT in real applications)
  if (token !== 'Bearer valid-token') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// DTOs
interface CreateUserDto {
  name: string;
  email: string;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
}

// Controller
@Controller({ path: '/users', middlewares: [loggingMiddleware] })
export class UserController {
  @Get()
  async getUsers(req: express.Request, res: express.Response, next: express.NextFunction) {
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '10';
    
    return {
      users: [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
      ],
      pagination: { page: parseInt(page), limit: parseInt(limit) }
    };
  }

  @Get('/:id')
  async getUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    
    if (id === '1') {
      return { id: '1', name: 'John Doe', email: 'john@example.com' };
    }
    
    res.status(404);
    return { error: 'User not found' };
  }

  @Post()
  async createUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const userData = req.body as CreateUserDto;
    
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    
    return { user: newUser, message: 'User created successfully' };
  }

  @Put('/:id')
  @Authenticated(authMiddleware)
  async updateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    const userData = req.body as UpdateUserDto;
    
    const updatedUser = {
      id,
      ...userData,
      updatedAt: new Date().toISOString()
    };
    
    return { user: updatedUser, message: 'User updated successfully' };
  }

  @Delete('/:id')
  @Authenticated(authMiddleware)
  async deleteUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    
    return { message: 'User deleted successfully', id };
  }
}

// App setup
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register controllers
registerControllers(app, [UserController], '/api');

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'ts5deco Express Controller Framework',
    endpoints: {
      users: '/api/users'
    }
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /api/users');
  console.log('- GET /api/users/:id');
  console.log('- POST /api/users');
  console.log('- PUT /api/users/:id (requires auth)');
  console.log('- DELETE /api/users/:id (requires auth)');
  console.log('');
  console.log('For protected routes, use header: Authorization: Bearer valid-token');
});
```

## Requirements

- Node.js 16+
- TypeScript 5.0+
- Express 4.18+

## License

MIT License - see the [LICENSE](LICENSE) file for details.
