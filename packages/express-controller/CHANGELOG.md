# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-07-26

### Added

#### 🎉 Type-Safe Response System
- **JsonResponse\<TData, TStatus\>**: Generic JSON response class with type-safe data and status codes
- **TextResponse\<TText, TStatus\>**: Generic text response class with string literal type support
- **NoContentResponse**: 204 No Content response for DELETE operations
- **RedirectResponse**: HTTP redirect responses with status code support
- **FileResponse**: File download and display responses

#### 🛠️ Convenience Methods
- **JsonResponses**: Static utility class with type-safe convenience methods
  - `JsonResponses.ok<T>(data)` - 200 OK
  - `JsonResponses.created<T>(data)` - 201 Created
  - `JsonResponses.badRequest<T>(error)` - 400 Bad Request
  - `JsonResponses.unauthorized<T>(error)` - 401 Unauthorized
  - `JsonResponses.forbidden<T>(error)` - 403 Forbidden
  - `JsonResponses.notFound<T>(error)` - 404 Not Found
  - `JsonResponses.internalError<T>(error)` - 500 Internal Server Error

- **TextResponses**: Static utility class for text responses
  - `TextResponses.ok<T>(text)` - 200 OK
  - `TextResponses.created<T>(text)` - 201 Created  
  - `TextResponses.badRequest<T>(text)` - 400 Bad Request
  - `TextResponses.unauthorized<T>(text)` - 401 Unauthorized
  - `TextResponses.forbidden<T>(text)` - 403 Forbidden
  - `TextResponses.notFound<T>(text)` - 404 Not Found
  - `TextResponses.internalError<T>(text)` - 500 Internal Server Error

- **RedirectResponses**: Static utility class for redirects
  - `RedirectResponses.temporary(url)` - 302 Found
  - `RedirectResponses.permanent(url)` - 301 Moved Permanently
  - `RedirectResponses.temporaryPreserveMethod(url)` - 307 Temporary Redirect
  - `RedirectResponses.permanentPreserveMethod(url)` - 308 Permanent Redirect

- **FileResponses**: Static utility class for file responses
  - `FileResponses.inline(path, filename)` - Inline file display
  - `FileResponses.attachment(path, filename)` - Force file download

#### 🔧 Framework Integration
- **Automatic Response Handling**: Framework automatically detects BaseResponse instances
- **Router Integration**: Updated router to call `.send(res)` on BaseResponse objects
- **Backward Compatibility**: Existing `res.json()` and return value patterns still work

#### 📚 Documentation
- **Complete Response System Documentation**: Comprehensive guide with examples
- **Updated README**: Added Response System section with usage examples
- **Type Examples**: Extensive examples showing generic usage patterns
- **Migration Guide**: How to migrate from traditional Express patterns

### Benefits

- **Type Safety**: Compile-time checking of response data types and HTTP status codes
- **Clean Code**: Eliminates repetitive `res.status().json()` boilerplate
- **Consistency**: Standardized response handling across applications
- **IDE Support**: Full IntelliSense and auto-completion for response data
- **Error Prevention**: TypeScript catches type mismatches at compile time
- **Developer Experience**: More intuitive and expressive response creation

### Examples

#### Before (Traditional Express)
```typescript
@Get('/users/:id')
async getUserById(req: Request, res: Response) {
  const user = await this.userService.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({ 
      error: 'User not found',
      message: 'The requested user does not exist'
    });
  }
  
  res.status(200).json(user);
}
```

#### After (Type-Safe Response System)
```typescript
@Get('/users/:id')
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
```

## [0.1.0] - 2025-07-25

### Added
- Initial release of ts5deco Express Controller Framework
- Modern TypeScript 5 decorator support
- Express.js integration
- Controller and route decorators (@Controller, @Get, @Post, etc.)
- Middleware support (@Use, @Authenticated, @Authorized, @Validated)
- Automatic route registration
- WeakMap-based metadata storage (no reflect-metadata dependency)
