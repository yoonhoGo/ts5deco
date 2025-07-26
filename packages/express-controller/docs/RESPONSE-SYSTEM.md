# Response System Documentation

The ts5deco Express Controller Framework provides a powerful and type-safe response system that eliminates the need for repetitive `res.status().json()` boilerplate code while ensuring complete type safety.

## Overview

Instead of writing:
```typescript
res.status(200).json({ users: [...] });
res.status(404).json({ error: 'Not found' });
```

You can now write:
```typescript
return new JsonResponse<User[], 200>(200, users);
return JsonResponses.notFound<ErrorResponse>({ error: 'Not found' });
```

## Core Classes

### BaseResponse

Abstract base class that all response types extend from:

```typescript
abstract class BaseResponse {
  constructor(public readonly statusCode: number) {}
  abstract send(res: Response): void;
}
```

### JsonResponse<TData, TStatus>

Type-safe JSON responses with generics for data type and status code.

#### Generic Parameters
- `TData`: The type of the JSON data (defaults to `any`)
- `TStatus`: The HTTP status code type (defaults to `number`)

#### Constructor
```typescript
constructor(statusCode: TStatus, data?: TData)
```

#### Examples

```typescript
// Basic usage without generics (backward compatible)
return new JsonResponse(200, { message: 'Hello' });

// With type safety for data
interface User { id: number; name: string; email: string; }
return new JsonResponse<User, 200>(200, user);

// With complex types
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
}
return new JsonResponse<PaginatedResponse<User>, 200>(200, {
  data: users,
  total: 100,
  page: 1
});

// Error responses
interface ErrorResponse { error: string; message: string; code?: string; }
return new JsonResponse<ErrorResponse, 404>(404, {
  error: 'Not Found',
  message: 'User not found',
  code: 'USER_NOT_FOUND'
});
```

### TextResponse<TText, TStatus>

Type-safe text responses with generics for text type and status code.

#### Generic Parameters
- `TText`: The type of text data (extends `string`, defaults to `string`)
- `TStatus`: The HTTP status code type (defaults to `number`)

#### Constructor
```typescript
constructor(statusCode: TStatus, text?: TText)
```

#### Examples

```typescript
// Basic usage
return new TextResponse(200, 'Hello World');

// With literal type for exact string
return new TextResponse<'healthy', 200>(200, 'healthy');

// With template literal types
return new TextResponse<`v${string}`, 200>(200, 'v1.2.3');

// With union types for restricted values
return new TextResponse<'running' | 'stopped' | 'error', 200>(200, 'running');
```

## Convenience Methods

### JsonResponses

Static utility class providing type-safe convenience methods for common HTTP status codes:

```typescript
// 200 OK
JsonResponses.ok<User>(user): JsonResponse<User, 200>

// 201 Created  
JsonResponses.created<CreateUserResponse>(newUser): JsonResponse<CreateUserResponse, 201>

// 400 Bad Request
JsonResponses.badRequest<ErrorResponse>(error): JsonResponse<ErrorResponse, 400>

// 401 Unauthorized
JsonResponses.unauthorized<ErrorResponse>(error): JsonResponse<ErrorResponse, 401>

// 403 Forbidden
JsonResponses.forbidden<ErrorResponse>(error): JsonResponse<ErrorResponse, 403>

// 404 Not Found
JsonResponses.notFound<ErrorResponse>(error): JsonResponse<ErrorResponse, 404>

// 500 Internal Server Error
JsonResponses.internalError<ErrorResponse>(error): JsonResponse<ErrorResponse, 500>
```

### TextResponses

Static utility class providing type-safe convenience methods for text responses:

```typescript
// 200 OK
TextResponses.ok<string>(text): TextResponse<string | 'OK', 200>

// 201 Created
TextResponses.created<string>(text): TextResponse<string | 'Created', 201>

// 400 Bad Request
TextResponses.badRequest<string>(text): TextResponse<string | 'Bad Request', 400>

// 401 Unauthorized
TextResponses.unauthorized<string>(text): TextResponse<string | 'Unauthorized', 401>

// 403 Forbidden
TextResponses.forbidden<string>(text): TextResponse<string | 'Forbidden', 403>

// 404 Not Found
TextResponses.notFound<string>(text): TextResponse<string | 'Not Found', 404>

// 500 Internal Server Error
TextResponses.internalError<string>(text): TextResponse<string | 'Internal Server Error', 500>
```

## Other Response Types

### NoContentResponse

For 204 No Content responses (no generics needed):

```typescript
return new NoContentResponse(); // Always 204 status
```

### RedirectResponse

For HTTP redirects:

```typescript
// Temporary redirect (302)
return new RedirectResponse('/new-path');

// Permanent redirect (301)  
return new RedirectResponse('/new-path', true);

// Custom status code
return new RedirectResponse('/new-path', 307);

// Convenience methods
return RedirectResponses.temporary('/path');    // 302
return RedirectResponses.permanent('/path');    // 301
```

### FileResponse

For file downloads and display:

```typescript
// Send file inline
return new FileResponse('/path/to/file.pdf', 'document.pdf');

// Force download
return new FileResponse('/path/to/file.zip', 'archive.zip', true);

// Convenience methods
return FileResponses.inline('/path/to/file.pdf', 'doc.pdf');
return FileResponses.attachment('/path/to/file.zip', 'archive.zip');
```

## Complete Controller Example

```typescript
import { Request } from 'express';
import { 
  Controller, 
  Get, 
  Post, 
  Delete,
  JsonResponse,
  JsonResponses,
  TextResponse,
  TextResponses,
  NoContentResponse
} from 'ts5deco-express-controller';

// Type definitions
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Controller('/api/users')
export class UserController {
  
  @Get('/')
  async getUsers(): Promise<JsonResponse<PaginatedResponse<User>, 200>> {
    const users = await this.userService.getUsers();
    
    return new JsonResponse<PaginatedResponse<User>, 200>(200, {
      data: users,
      total: users.length,
      page: 1,
      limit: 10
    });
  }

  @Get('/:id')
  async getUserById(req: Request): Promise<JsonResponse<User, 200> | JsonResponse<ErrorResponse, 404>> {
    const id = parseInt(req.params.id);
    const user = await this.userService.findById(id);
    
    if (!user) {
      return JsonResponses.notFound<ErrorResponse>({
        error: 'User not found',
        message: `User with id ${id} does not exist`,
        code: 'USER_NOT_FOUND'
      });
    }
    
    return JsonResponses.ok<User>(user);
  }

  @Post('/')
  async createUser(req: Request): Promise<JsonResponse<User, 201> | JsonResponse<ErrorResponse, 400>> {
    try {
      const user = await this.userService.create(req.body);
      return JsonResponses.created<User>(user);
    } catch (error) {
      return JsonResponses.badRequest<ErrorResponse>({
        error: 'Validation failed',
        message: error.message,
        code: 'VALIDATION_ERROR'
      });
    }
  }

  @Delete('/:id')
  async deleteUser(req: Request): Promise<NoContentResponse | JsonResponse<ErrorResponse, 404>> {
    const id = parseInt(req.params.id);
    const deleted = await this.userService.delete(id);
    
    if (!deleted) {
      return JsonResponses.notFound<ErrorResponse>({
        error: 'User not found',
        message: `User with id ${id} does not exist`,
        code: 'USER_NOT_FOUND'
      });
    }
    
    return new NoContentResponse();
  }

  @Get('/health')
  async healthCheck(): Promise<TextResponse<'healthy', 200>> {
    return new TextResponse<'healthy', 200>(200, 'healthy');
  }

  @Get('/version')
  async getVersion(): Promise<TextResponse<`v${string}`, 200>> {
    return TextResponses.ok<'v1.0.0'>('v1.0.0');
  }
}
```

## Benefits

### 1. Type Safety
- **Data Types**: Generic `TData` ensures response data matches expected type
- **Status Codes**: Generic `TStatus` provides compile-time status code validation
- **IDE Support**: Full IntelliSense and auto-completion

### 2. Consistency
- **Standardized**: All responses follow the same pattern
- **Predictable**: Consistent status codes and response formats
- **Maintainable**: Easy to change response structure across the application

### 3. Developer Experience
- **Clean Code**: No more repetitive `res.status().json()` calls
- **Explicit Intent**: Response type clearly indicates what's being returned
- **Error Prevention**: TypeScript catches mismatched types at compile time

### 4. Backward Compatibility
- **Gradual Migration**: Existing `res.json()` code continues to work
- **Optional Generics**: Can use with or without type parameters
- **No Breaking Changes**: Fully compatible with existing Express applications

## Integration with Router

The framework automatically detects `BaseResponse` instances and calls the appropriate `send()` method:

```typescript
// In your controller method
return new JsonResponse<User, 200>(200, user);

// Framework automatically handles this as:
if (result instanceof BaseResponse) {
  result.send(res);  // Calls JsonResponse.send() method
  return;
}
```

## Testing

Response objects can be easily tested:

```typescript
// Test the response object directly
const response = new JsonResponse<User, 200>(200, mockUser);
expect(response.statusCode).toBe(200);
expect(response.data).toEqual(mockUser);

// Test convenience methods
const errorResponse = JsonResponses.notFound<ErrorResponse>({ 
  error: 'Not found',
  message: 'User not found' 
});
expect(errorResponse.statusCode).toBe(404);
expect(errorResponse.data.error).toBe('Not found');
```

## Migration Guide

### From Traditional Express

```typescript
// Before
app.get('/users', (req, res) => {
  res.status(200).json({ users: [...] });
});

// After
@Controller('/api')
class UserController {
  @Get('/users')
  async getUsers(): Promise<JsonResponse<User[], 200>> {
    return new JsonResponse<User[], 200>(200, users);
  }
}
```

### Adding Generics to Existing Code

```typescript
// Before (still works)
return new JsonResponse(200, user);

// After (with type safety)
return new JsonResponse<User, 200>(200, user);

// Or using convenience methods
return JsonResponses.ok<User>(user);
```

This response system provides a powerful, type-safe, and developer-friendly way to handle HTTP responses in Express applications while maintaining full backward compatibility.
