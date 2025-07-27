import { Request } from 'express';
import {
  Controller,
  Get,
  Post,
  Delete,
  JsonResponse,
  TextResponse,
  NoContentResponse,
  RedirectResponse,
  RedirectResponses,
  FileResponse,
  FileResponses
} from '../src';

/**
 * 새로운 Response 시스템을 보여주는 예제 컨트롤러
 */
@Controller('/demo')
export class ResponseDemoController {

  /**
   * JSON 응답 예제들
   */
  @Get('/users')
  async getUsers(): Promise<JsonResponse> {
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];

    // 직접 생성
    return new JsonResponse(200, { users, total: users.length });
  }

  @Get('/user/:id')
  async getUserById(req: Request): Promise<JsonResponse> {
    const id = parseInt(req.params.id);

    if (id === 1) {
      // 편의 메서드 사용
      return JsonResponse.ok({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      });
    }

    // 404 응답
    return JsonResponse.notFound({
      error: 'User not found',
      message: `User with id ${id} does not exist`
    });
  }

  @Post('/users')
  async createUser(req: Request): Promise<JsonResponse> {
    // 간단한 유효성 검사
    if (!req.body.name || !req.body.email) {
      return JsonResponse.badRequest({
        error: 'Validation failed',
        message: 'Name and email are required'
      });
    }

    const newUser = {
      id: Date.now(),
      name: req.body.name,
      email: req.body.email,
      createdAt: new Date().toISOString()
    };

    // 201 Created 응답
    return JsonResponse.created(newUser);
  }

  /**
   * Text 응답 예제들
   */
  @Get('/health')
  async healthCheck(): Promise<TextResponse> {
    return TextResponse.ok('Service is running smoothly');
  }

  @Get('/version')
  async getVersion(): Promise<TextResponse> {
    return new TextResponse(200, 'v1.0.0');
  }

  @Get('/error-demo')
  async errorDemo(): Promise<TextResponse> {
    return TextResponse.internalError('Something went wrong');
  }

  /**
   * NoContent 응답 예제
   */
  @Delete('/user/:id')
  async deleteUser(req: Request): Promise<NoContentResponse | JsonResponse> {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return JsonResponse.badRequest({
        error: 'Invalid ID',
        message: 'User ID must be a number'
      });
    }

    // 삭제 로직 (실제로는 DB에서 삭제)
    console.log(`Deleting user with id: ${id}`);

    // 204 No Content 응답
    return new NoContentResponse();
  }

  /**
   * Redirect 응답 예제들
   */
  @Get('/old-path')
  async oldPath(): Promise<RedirectResponse> {
    // 영구 리다이렉트
    return RedirectResponses.permanent('/demo/new-path');
  }

  @Get('/temp-redirect')
  async tempRedirect(): Promise<RedirectResponse> {
    // 임시 리다이렉트
    return RedirectResponses.temporary('/demo/users');
  }

  @Get('/login-redirect')
  async loginRedirect(): Promise<RedirectResponse> {
    // 커스텀 리다이렉트
    return new RedirectResponse('/login?returnUrl=/demo/users', 302);
  }

  /**
   * File 응답 예제들 (실제 파일이 필요)
   */
  @Get('/download-report')
  async downloadReport(): Promise<FileResponse | JsonResponse> {
    const filePath = '/tmp/report.pdf'; // 실제 파일 경로

    try {
      // 파일 다운로드 (첨부파일로)
      return FileResponses.attachment(filePath, 'monthly-report.pdf');
    } catch (error) {
      return JsonResponse.notFound({
        error: 'File not found',
        message: 'The requested report is not available'
      });
    }
  }

  @Get('/view-document')
  async viewDocument(): Promise<FileResponse | JsonResponse> {
    const filePath = '/tmp/document.pdf'; // 실제 파일 경로

    try {
      // 파일 인라인 뷰 (브라우저에서 바로 보기)
      return FileResponses.inline(filePath, 'document.pdf');
    } catch (error) {
      return JsonResponse.notFound({
        error: 'Document not found',
        message: 'The requested document is not available'
      });
    }
  }

  /**
   * 기존 방식도 여전히 지원
   */
  @Get('/legacy')
  async legacyResponse(): Promise<any> {
    // 기존 방식 - 자동으로 JSON 응답
    return {
      message: 'This still works!',
      timestamp: new Date().toISOString()
    };
  }
}
