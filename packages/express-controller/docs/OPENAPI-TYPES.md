# OpenAPI Type Integration Guide

This guide explains how to use OpenAPI specifications to generate TypeScript types for your Express controllers, ensuring type safety and consistency between your API documentation and implementation.

## Overview

The `ts5deco-express-controller` framework now supports OpenAPI type generation using `openapi-typescript`. This allows you to:

- Generate TypeScript types from your OpenAPI/Swagger specifications
- Ensure type safety between API documentation and implementation
- Get IntelliSense support for API types
- Maintain a single source of truth for your API schema

## Installation and Setup

### 1. Install the Package

```bash
npm install ts5deco-express-controller
```

### 2. Initialize a New Project (Optional)

For new projects, you can use the CLI to initialize a complete setup:

```bash
npx ts5deco-express-controller init --dir ./my-api-project
```

This creates:
- Basic project structure
- Sample OpenAPI specification
- TypeScript configuration
- Type generation scripts
- Example controller with types

### 2. Create Your OpenAPI Specification

Create an OpenAPI specification file (YAML or JSON) in the `api/` directory:

```yaml
# api/openapi.yaml
openapi: 3.0.0
info:
  title: Your API
  version: 1.0.0

paths:
  /users/{id}:
    get:
      summary: Get user by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: Not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    User:
      type: object
      required:
        - id
        - name
        - email
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
          format: email
    Error:
      type: object
      required:
        - error
        - message
      properties:
        error:
          type: string
        message:
          type: string
```

### 3. Generate Types

#### Method 1: Using CLI (Recommended)

Generate types using the CLI command:

```bash
# Generate types from OpenAPI spec
npx ts5deco-express-controller generate --input ./api/openapi.yaml --output ./src/types/generated

# With custom paths for helper files
npx ts5deco-express-controller generate \
  --input ./api/openapi.yaml \
  --output ./src/types/generated \
  --api-types ./src/types/api.ts \
  --utils ./src/types/openapi-utils.ts
```

#### Method 2: Using npm scripts

Add the following to your `package.json`:

```json
{
  "scripts": {
    "generate": "ts5deco-express-controller generate --input ./api/openapi.yaml --output ./src/types/generated",
    "generate:types": "npm run generate"
  }
}
```

Then run:

```bash
npm run generate
```

#### Method 3: Programmatic API

For custom build scripts or advanced integration:

```typescript
import { generateTypes, initProject } from 'ts5deco-express-controller';

async function setupTypes() {
  // Initialize project structure (optional)
  await initProject('./my-project');
  
  // Generate types
  await generateTypes({
    input: './api/openapi.yaml',
    outputDir: './src/types/generated',
    apiTypesPath: './src/types/api.ts',
    utilsPath: './src/types/openapi-utils.ts',
  });
}

setupTypes().catch(console.error);
```

All methods will:
1. Generate TypeScript types from your OpenAPI spec
2. Create type utilities for easy usage
3. Update helper files automatically

## Usage

### Basic Example

```typescript
import { Request, Response, NextFunction } from 'express';
import { Controller, Get, JsonResponses } from 'ts5deco-express-controller';
import type { User, ErrorResponse } from './types/api';

@Controller('/api/users')
export class UserController {
  
  @Get('/:id')
  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<JsonResponse<User, 200> | JsonResponse<ErrorResponse, 404>> {
    const { id } = req.params;
    const user = await this.userService.findById(id);
    
    if (!user) {
      return JsonResponses.notFound<ErrorResponse>({
        error: 'NOT_FOUND',
        message: `User with id ${id} not found`
      });
    }
    
    return JsonResponses.ok<User>(user);
  }
}
```

### Using Type Utilities

The framework provides several utility types for working with OpenAPI types:

```typescript
import { ExtractSchema, ExtractResponse, ExtractRequestBody } from './types/openapi-utils';

// Extract schema types
type User = ExtractSchema<'User'>;
type ErrorResponse = ExtractSchema<'Error'>;

// Extract response types for specific endpoints
type GetUserResponse = ExtractResponse<'/users/{id}', 'get'>;
type CreateUserResponse = ExtractResponse<'/users', 'post', 201>;

// Extract request body types
type CreateUserRequest = ExtractRequestBody<'/users', 'post'>;
```

### Type Aliases

For better readability, use the pre-defined type aliases in `src/types/api.ts`:

```typescript
// Instead of: components['schemas']['User']
import { User } from './types/api';

// Instead of: components['schemas']['Error']
import { ErrorResponse } from './types/api';

// For paginated responses
import { PaginatedResponse } from './types/api';

const response: PaginatedResponse<User> = {
  data: users,
  total: 100,
  page: 1,
  limit: 10,
  hasNext: true,
  hasPrev: false
};
```

### Advanced Usage with Namespaces

Use namespaces to organize your types:

```typescript
import { API, APIResponse } from './types/api';

// Use schema types
const user: API.User = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
};

// Use response types (when enabled)
const response: APIResponse.GetUser = user;
```

## CLI Reference

### `init` Command

Initialize a new project with complete OpenAPI integration:

```bash
npx ts5deco-express-controller init [options]
```

**Options:**
- `--dir <directory>`: Target directory for initialization (default: current directory)

**Example:**
```bash
npx ts5deco-express-controller init --dir ./my-api-project
```

### `generate` Command

Generate TypeScript types from OpenAPI specification:

```bash
npx ts5deco-express-controller generate [options]
```

**Options:**
- `--input <file>`: Path to OpenAPI specification file (YAML or JSON)
- `--output <directory>`: Output directory for generated types
- `--api-types <file>`: Path for API type aliases file (optional)
- `--utils <file>`: Path for utility types file (optional)

**Examples:**
```bash
# Basic usage
npx ts5deco-express-controller generate --input ./api/openapi.yaml --output ./src/types/generated

# With custom helper files
npx ts5deco-express-controller generate \
  --input ./api/openapi.yaml \
  --output ./src/types/generated \
  --api-types ./src/types/api.ts \
  --utils ./src/types/openapi-utils.ts
```

## Programmatic API Reference

### `generateTypes(options)`

Generate types programmatically:

```typescript
import { generateTypes } from 'ts5deco-express-controller';

interface GenerateTypesOptions {
  input: string;           // Path to OpenAPI spec
  outputDir: string;       // Output directory
  apiTypesPath?: string;   // Optional: API types file path
  utilsPath?: string;      // Optional: Utils file path
}

await generateTypes({
  input: './api/openapi.yaml',
  outputDir: './src/types/generated',
  apiTypesPath: './src/types/api.ts',
  utilsPath: './src/types/openapi-utils.ts',
});
```

### `initProject(directory)`

Initialize a new project structure:

```typescript
import { initProject } from 'ts5deco-express-controller';

// Initialize in current directory
await initProject('.');

// Initialize in specific directory
await initProject('./my-new-project');
```

## Path Conversion

OpenAPI uses `{param}` syntax while Express uses `:param`. The framework handles this automatically:

```typescript
import { convertOpenAPIPath, convertExpressPath } from 'ts5deco-express-controller';

// Convert OpenAPI to Express
convertOpenAPIPath('/users/{id}'); // Returns: '/users/:id'

// Convert Express to OpenAPI
convertExpressPath('/users/:id'); // Returns: '/users/{id}'
```

## Best Practices

### 1. Keep Your OpenAPI Spec Updated

Always update your OpenAPI specification when making API changes:

```bash
# After updating openapi.yaml
npm run generate
```

### 2. Use Type Guards

Create type guards for runtime validation:

```typescript
function isUser(data: any): data is User {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.email === 'string'
  );
}
```

### 3. Define Response Types

Define explicit response types for better type safety:

```typescript
type GetUserResponse = 
  | JsonResponse<User, 200> 
  | JsonResponse<ErrorResponse, 404>;

@Get('/:id')
async getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<GetUserResponse> {
  // Implementation
}
```

### 4. Handle Request Body Types

Always validate and type your request bodies:

```typescript
@Post('/')
async createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<CreateUserResponse> {
  const userData = req.body as CreateUserRequest;
  
  // Validate userData before using
  if (!userData.name || !userData.email) {
    return JsonResponses.badRequest<ErrorResponse>({
      error: 'VALIDATION_ERROR',
      message: 'Missing required fields'
    });
  }
  
  // Process the request
}
```

## Workflow

### Development Workflow

1. **Define/Update OpenAPI Spec**: Start by defining your API in `api/openapi.yaml`
2. **Generate Types**: Run `npm run generate`
3. **Implement Controllers**: Use the generated types in your controllers
4. **Type Check**: Run `npm run typecheck` to ensure type safety

### CI/CD Integration

Add type generation to your build process:

```json
{
  "scripts": {
    "prebuild": "npm run generate",
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

## Troubleshooting

### Types Not Found

If TypeScript can't find the generated types:

1. Ensure you've run `npm run generate`
2. Check that `src/types/generated/api.d.ts` exists
3. Restart your TypeScript language server

### Type Mismatches

If you get type errors after updating the OpenAPI spec:

1. Re-run `npm run generate`
2. Update your controller implementations to match the new types
3. Check for breaking changes in the API specification

### Path Parameter Issues

If path parameters aren't working:

- Ensure you're using Express format (`:param`) in your decorators
- The generated types use OpenAPI format (`{param}`)
- Use the path converter utilities if needed

## Example Project Structure

```
packages/express-controller/
├── api/
│   └── openapi.yaml          # OpenAPI specification
├── src/
│   ├── controllers/
│   │   └── user.controller.ts # Controllers using generated types
│   ├── types/
│   │   ├── generated/
│   │   │   └── api.d.ts      # Auto-generated types
│   │   ├── api.ts            # Type aliases for better readability
│   │   └── openapi-utils.ts  # Type utility functions
│   └── utils/
│       └── path-converter.ts  # Path conversion utilities
├── scripts/
│   └── generate-type-helpers.js # Post-generation script
└── package.json
```

## Conclusion

By integrating OpenAPI type generation into your Express controllers, you can:

- Maintain type safety across your entire API
- Keep your documentation and implementation in sync
- Reduce runtime errors with compile-time type checking
- Improve developer experience with better IntelliSense

For more examples, see the `examples/typed-controller.example.ts` file.
