#!/usr/bin/env node

/**
 * OpenAPI 타입 생성 후 헬퍼 파일들을 업데이트하는 스크립트
 */

const fs = require('fs');
const path = require('path');

const GENERATED_FILE = path.join(__dirname, '../src/types/generated/api.d.ts');
const UTILS_FILE = path.join(__dirname, '../src/types/openapi-utils.ts');
const API_FILE = path.join(__dirname, '../src/types/api.ts');

/**
 * 생성된 타입 파일이 있는지 확인
 */
function checkGeneratedFile() {
  if (!fs.existsSync(GENERATED_FILE)) {
    console.log('⚠️  Generated types not found. Please run "npm run generate:api-types" first.');
    return false;
  }
  return true;
}

/**
 * openapi-utils.ts 파일 업데이트
 */
function updateUtilsFile() {
  let content = fs.readFileSync(UTILS_FILE, 'utf8');
  
  // 주석 처리된 import 문 활성화
  content = content.replace(
    /\/\/ import type { paths, components } from '\.\/generated\/api';/,
    "import type { paths, components } from './generated/api';"
  );
  
  // 임시 타입을 실제 구현으로 교체
  content = content.replace(
    /export type ExtractSchema<T extends string> = any; \/\/ 임시 타입/,
    '// export type ExtractSchema<T extends string> = any; // 임시 타입'
  );
  
  // 실제 구현 주석 해제
  content = content.replace(/\/\/ export type ExtractSchema/g, 'export type ExtractSchema');
  content = content.replace(/\/\/ export type ExtractResponse/g, 'export type ExtractResponse');
  content = content.replace(/\/\/ export type ExtractRequestBody/g, 'export type ExtractRequestBody');
  content = content.replace(/\/\/ export type ExtractParameters/g, 'export type ExtractParameters');
  
  fs.writeFileSync(UTILS_FILE, content);
  console.log('✅ Updated openapi-utils.ts');
}

/**
 * 생성된 타입에서 스키마 이름들 추출
 */
function extractSchemaNames() {
  const content = fs.readFileSync(GENERATED_FILE, 'utf8');
  const schemaMatch = content.match(/schemas:\s*{([^}]+)}/s);
  
  if (!schemaMatch) {
    console.log('⚠️  No schemas found in generated types');
    return [];
  }
  
  const schemas = schemaMatch[1];
  const schemaNames = [];
  const regex = /(\w+):\s*{/g;
  let match;
  
  while ((match = regex.exec(schemas)) !== null) {
    schemaNames.push(match[1]);
  }
  
  return schemaNames;
}

/**
 * API 타입 파일 업데이트 (선택적)
 */
function updateApiFile(schemaNames) {
  console.log('\n📋 Found schemas:', schemaNames.join(', '));
  console.log('\n💡 You can now update src/types/api.ts to use the actual generated types.');
  console.log('   Replace the temporary interfaces with:');
  console.log('   export type User = ExtractSchema<\'User\'>;');
  console.log('   export type ErrorResponse = ExtractSchema<\'Error\'>;');
  console.log('   etc...\n');
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('🔧 Updating OpenAPI type helpers...\n');
  
  if (!checkGeneratedFile()) {
    return;
  }
  
  updateUtilsFile();
  
  const schemaNames = extractSchemaNames();
  updateApiFile(schemaNames);
  
  console.log('✨ Done!');
}

main();
