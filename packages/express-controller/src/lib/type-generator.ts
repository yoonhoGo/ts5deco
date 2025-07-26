/**
 * OpenAPI TypeScript 타입 생성기
 * CLI와 programmatic API를 위한 핵심 로직
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export interface GenerateTypesOptions {
  /** OpenAPI 스펙 파일 경로 */
  input: string;
  /** 생성된 타입 파일 출력 디렉토리 */
  outputDir: string;
  /** API 타입 별칭 파일 경로 */
  apiTypesPath?: string;
  /** 유틸리티 타입 파일 경로 */
  utilsPath?: string;
  /** 타입 별칭 생성 여부 */
  generateAliases?: boolean;
  /** 유틸리티 타입 생성 여부 */
  generateUtils?: boolean;
  /** 추가 openapi-typescript 옵션 */
  openapiTypescriptOptions?: string[];
}

/**
 * OpenAPI 스펙에서 TypeScript 타입을 생성합니다
 */
export async function generateTypes(options: GenerateTypesOptions): Promise<void> {
  const {
    input,
    outputDir,
    apiTypesPath,
    utilsPath,
    generateAliases = true,
    generateUtils = true,
    openapiTypescriptOptions = []
  } = options;

  // 입력 파일 존재 확인
  try {
    await fs.access(input);
  } catch (error) {
    throw new Error(`OpenAPI specification file not found: ${input}`);
  }

  // 출력 디렉토리 생성
  await fs.mkdir(outputDir, { recursive: true });

  const outputFile = path.join(outputDir, 'api.d.ts');

  // openapi-typescript 실행
  console.log(`📄 Processing ${input}...`);
  
  const openapiCmd = [
    'npx openapi-typescript',
    `"${input}"`,
    '-o',
    `"${outputFile}"`,
    ...openapiTypescriptOptions
  ].join(' ');

  try {
    execSync(openapiCmd, { stdio: 'inherit' });
    console.log(`✅ Generated types: ${outputFile}`);
  } catch (error) {
    throw new Error(`Failed to generate types: ${error.message}`);
  }

  // 스키마 이름 추출
  const schemaNames = await extractSchemaNames(outputFile);
  
  // 유틸리티 타입 생성
  if (generateUtils && utilsPath) {
    await generateUtilityTypes(utilsPath, outputFile);
    console.log(`✅ Generated utility types: ${utilsPath}`);
  }

  // API 타입 별칭 생성
  if (generateAliases && apiTypesPath) {
    await generateApiTypes(apiTypesPath, schemaNames, utilsPath);
    console.log(`✅ Generated API type aliases: ${apiTypesPath}`);
  }
}

/**
 * 생성된 타입 파일에서 스키마 이름들을 추출합니다
 */
async function extractSchemaNames(generatedFilePath: string): Promise<string[]> {
  try {
    const content = await fs.readFile(generatedFilePath, 'utf8');
    const schemaMatch = content.match(/schemas:\s*{([^}]+)}/s);
    
    if (!schemaMatch) {
      return [];
    }
    
    const schemas = schemaMatch[1];
    const schemaNames: string[] = [];
    const regex = /(\w+):\s*{/g;
    let match;
    
    while ((match = regex.exec(schemas)) !== null) {
      schemaNames.push(match[1]);
    }
    
    return schemaNames;
  } catch (error) {
    console.warn('Warning: Could not extract schema names:', error.message);
    return [];
  }
}

/**
 * 유틸리티 타입 파일을 생성합니다
 */
async function generateUtilityTypes(utilsPath: string, generatedFilePath: string): Promise<void> {
  const relativeImportPath = path.relative(
    path.dirname(utilsPath), 
    generatedFilePath
  ).replace(/\.d\.ts$/, '').replace(/\\/g, '/');

  const content = `/**
 * OpenAPI 타입 유틸리티
 * openapi-typescript로 생성된 타입들을 쉽게 사용하기 위한 헬퍼들
 */

import type { paths, components } from './${relativeImportPath}';

/**
 * OpenAPI 스키마에서 타입을 추출하는 헬퍼 타입
 * @example
 * \`\`\`typescript
 * type User = ExtractSchema<'User'>;
 * type ErrorResponse = ExtractSchema<'Error'>;
 * \`\`\`
 */
export type ExtractSchema<T extends keyof components['schemas']> = 
  components['schemas'][T];

/**
 * OpenAPI 경로에서 응답 타입을 추출하는 헬퍼 타입
 * @example
 * \`\`\`typescript
 * type GetUserResponse = ExtractResponse<'/users/{id}', 'get'>;
 * type CreateUserResponse = ExtractResponse<'/users', 'post', 201>;
 * \`\`\`
 */
export type ExtractResponse<
  TPath extends keyof paths,
  TMethod extends keyof paths[TPath],
  TStatus extends number = 200
> = TPath extends keyof paths
  ? TMethod extends keyof paths[TPath]
    ? paths[TPath][TMethod] extends { responses: any }
      ? TStatus extends keyof paths[TPath][TMethod]['responses']
        ? paths[TPath][TMethod]['responses'][TStatus] extends { 
            content: { 'application/json': infer T } 
          }
          ? T
          : never
        : never
      : never
    : never
  : never;

/**
 * OpenAPI 경로에서 요청 본문 타입을 추출하는 헬퍼 타입
 */
export type ExtractRequestBody<
  TPath extends keyof paths,
  TMethod extends keyof paths[TPath]
> = TPath extends keyof paths
  ? TMethod extends keyof paths[TPath]
    ? paths[TPath][TMethod] extends { 
        requestBody: { content: { 'application/json': infer T } } 
      }
      ? T
      : never
    : never
  : never;

/**
 * OpenAPI 경로에서 파라미터 타입을 추출하는 헬퍼 타입
 */
export type ExtractParameters<
  TPath extends keyof paths,
  TMethod extends keyof paths[TPath]
> = TPath extends keyof paths
  ? TMethod extends keyof paths[TPath]
    ? paths[TPath][TMethod] extends { parameters: infer P }
      ? P
      : never
    : never
  : never;

// 원본 타입들도 re-export
export type { paths, components };
`;

  await fs.mkdir(path.dirname(utilsPath), { recursive: true });
  await fs.writeFile(utilsPath, content);
}

/**
 * API 타입 별칭 파일을 생성합니다
 */
async function generateApiTypes(
  apiTypesPath: string, 
  schemaNames: string[], 
  utilsPath?: string
): Promise<void> {
  const utilsImport = utilsPath 
    ? `import type { ExtractSchema } from './${path.relative(
        path.dirname(apiTypesPath), 
        utilsPath
      ).replace(/\.ts$/, '').replace(/\\/g, '/')}';`
    : '';

  const content = `/**
 * API 타입 별칭
 * OpenAPI 스펙에서 생성된 타입들을 쉽게 사용하기 위한 별칭 정의
 * 
 * 이 파일은 자동 생성됩니다. 필요에 따라 수정하여 사용하세요.
 */

${utilsImport}

/**
 * 일반적으로 사용되는 타입 별칭들
 * 필요에 따라 추가하거나 수정하세요
 */
${schemaNames.map(name => {
  const alias = getCommonAlias(name);
  return alias ? `export type ${alias} = ExtractSchema<'${name}'>;` : `// export type ${name} = ExtractSchema<'${name}'>;`;
}).join('\n')}

/**
 * 모든 스키마 타입들 (참고용)
 * 아래 타입들을 위와 같이 별칭으로 만들어 사용할 수 있습니다:
 * 
${schemaNames.map(name => ` * - ${name}`).join('\n')}
 */
`;

  await fs.mkdir(path.dirname(apiTypesPath), { recursive: true });
  await fs.writeFile(apiTypesPath, content);
}

/**
 * 일반적인 스키마 이름에 대한 별칭을 제공합니다
 */
function getCommonAlias(schemaName: string): string | null {
  const commonAliases: Record<string, string> = {
    'User': 'User',
    'Error': 'ErrorResponse',
    'CreateUserRequest': 'CreateUserRequest',
    'UpdateUserRequest': 'UpdateUserRequest',
    'PaginatedUserResponse': 'PaginatedResponse',
    'ApiError': 'ApiError',
    'ValidationError': 'ValidationError'
  };

  return commonAliases[schemaName] || null;
}
