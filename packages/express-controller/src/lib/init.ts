/**
 * 프로젝트 초기화 도구
 * 새 프로젝트에서 OpenAPI 타입 생성을 시작할 수 있도록 도움
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * 새 프로젝트를 OpenAPI 타입 생성을 위해 초기화합니다
 */
export async function initProject(targetDir: string = '.'): Promise<void> {
  const resolvedDir = path.resolve(targetDir);
  
  // API 디렉토리 생성
  const apiDir = path.join(resolvedDir, 'api');
  await fs.mkdir(apiDir, { recursive: true });
  
  // 예제 OpenAPI 스펙 생성
  const openapiSpec = `openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
  description: API for my application

servers:
  - url: http://localhost:3000/api
    description: Local development server

paths:
  /users:
    get:
      summary: Get all users
      operationId: getUsers
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedUserResponse'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
    
    post:
      summary: Create a new user
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /users/{id}:
    get:
      summary: Get a user by ID
      operationId: getUserById
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
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
          example: "123"
        name:
          type: string
          example: "John Doe"
        email:
          type: string
          format: email
          example: "john@example.com"
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
    
    CreateUserRequest:
      type: object
      required:
        - name
        - email
        - password
      properties:
        name:
          type: string
          example: "John Doe"
        email:
          type: string
          format: email
          example: "john@example.com"
        password:
          type: string
          format: password
          minLength: 8
    
    Error:
      type: object
      required:
        - error
        - message
      properties:
        error:
          type: string
          example: "NOT_FOUND"
        message:
          type: string
          example: "The requested resource was not found"
        code:
          type: string
          example: "USER_NOT_FOUND"
        statusCode:
          type: integer
          example: 404
    
    PaginatedUserResponse:
      type: object
      required:
        - data
        - total
        - page
        - limit
        - hasNext
        - hasPrev
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        total:
          type: integer
          example: 100
        page:
          type: integer
          example: 1
        limit:
          type: integer
          example: 10
        hasNext:
          type: boolean
          example: true
        hasPrev:
          type: boolean
          example: false
`;

  await fs.writeFile(path.join(apiDir, 'openapi.yaml'), openapiSpec);
  
  // package.json 스크립트 추천 생성
  const packageJsonPath = path.join(resolvedDir, 'package.json');
  let shouldUpdatePackageJson = false;
  
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    if (!packageJson.scripts['generate:types']) {
      packageJson.scripts['generate:types'] = 'ts5deco-express-controller generate';
      shouldUpdatePackageJson = true;
    }
    
    if (!packageJson.scripts['generate']) {
      packageJson.scripts['generate'] = 'npm run generate:types';
      shouldUpdatePackageJson = true;
    }
    
    if (shouldUpdatePackageJson) {
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Updated package.json with recommended scripts');
    }
  } catch (error) {
    // package.json이 없거나 읽을 수 없는 경우 권장사항만 출력
    console.log('💡 Recommended package.json scripts:');
    console.log('   "generate:types": "ts5deco-express-controller generate"');
    console.log('   "generate": "npm run generate:types"');
  }
  
  // .gitignore 업데이트 권장
  try {
    const gitignorePath = path.join(resolvedDir, '.gitignore');
    let gitignoreContent = '';
    
    try {
      gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    } catch {
      // .gitignore가 없는 경우
    }
    
    if (!gitignoreContent.includes('src/types/generated/')) {
      gitignoreContent += '\n# Generated OpenAPI types\nsrc/types/generated/\n';
      await fs.writeFile(gitignorePath, gitignoreContent);
      console.log('✅ Updated .gitignore to exclude generated types');
    }
  } catch (error) {
    console.log('💡 Recommended .gitignore addition:');
    console.log('   src/types/generated/');
  }
  
  console.log(`\n📁 Created files:`);
  console.log(`   ${path.relative(process.cwd(), path.join(apiDir, 'openapi.yaml'))}`);
}
