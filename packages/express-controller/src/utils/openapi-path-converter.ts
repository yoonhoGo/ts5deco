/**
 * OpenAPI 경로를 Express 경로로 변환하는 유틸리티
 */

/**
 * OpenAPI 경로를 Express 경로로 변환
 * 예: '/users/{id}' -> '/users/:id'
 * 예: '/users/{userId}/posts/{postId}' -> '/users/:userId/posts/:postId'
 */
export function convertOpenApiPathToExpressPath(openApiPath: string): string {
  return openApiPath.replace(/{([^}]+)}/g, ':$1');
}

/**
 * Express 경로를 OpenAPI 경로로 변환 (역변환)
 * 예: '/users/:id' -> '/users/{id}'
 */
export function convertExpressPathToOpenApiPath(expressPath: string): string {
  return expressPath.replace(/:([^/]+)/g, '{$1}');
}

/**
 * 경로에서 파라미터 이름들을 추출
 * 예: '/users/{id}/posts/{postId}' -> ['id', 'postId']
 */
export function extractPathParameterNames(openApiPath: string): string[] {
  const matches = openApiPath.match(/{([^}]+)}/g);
  if (!matches) return [];
  
  return matches.map(match => match.slice(1, -1)); // {} 제거
}

/**
 * 경로가 유효한 OpenAPI 경로 형식인지 검증
 */
export function isValidOpenApiPath(path: string): boolean {
  // 기본적인 검증: {param} 형식의 파라미터가 올바른지 확인
  const braceCount = (path.match(/{/g) || []).length;
  const closeBraceCount = (path.match(/}/g) || []).length;
  
  if (braceCount !== closeBraceCount) {
    return false;
  }
  
  // 중첩된 브레이스가 없는지 확인
  let openBraces = 0;
  for (const char of path) {
    if (char === '{') {
      openBraces++;
      if (openBraces > 1) return false;
    } else if (char === '}') {
      openBraces--;
      if (openBraces < 0) return false;
    }
  }
  
  return openBraces === 0;
}

/**
 * 경로 매칭을 위한 정규식 생성
 * Express 경로 매칭과 유사한 기능
 */
export function createPathMatcher(openApiPath: string): RegExp {
  const expressPath = convertOpenApiPathToExpressPath(openApiPath);
  const regexPath = expressPath
    .replace(/:[^/]+/g, '([^/]+)')  // 파라미터를 캡처 그룹으로 변환
    .replace(/\//g, '\\/');        // 슬래시 이스케이프
  
  return new RegExp(`^${regexPath}$`);
}

/**
 * 실제 경로에서 파라미터 값을 추출
 */
export function extractPathParameterValues(
  openApiPath: string, 
  actualPath: string
): Record<string, string> {
  const paramNames = extractPathParameterNames(openApiPath);
  const matcher = createPathMatcher(openApiPath);
  const matches = actualPath.match(matcher);
  
  if (!matches || matches.length !== paramNames.length + 1) {
    return {};
  }
  
  const result: Record<string, string> = {};
  paramNames.forEach((paramName, index) => {
    const value = matches[index + 1];
    if (value !== undefined) {
      result[paramName] = value; // matches[0]은 전체 매치
    }
  });
  
  return result;
}