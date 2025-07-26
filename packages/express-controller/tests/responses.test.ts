import { Response } from 'express';
import { 
  BaseResponse,
  JsonResponse,
  TextResponse,
  FileResponse,
  FileResponses,
  NoContentResponse,
  RedirectResponse,
  RedirectResponses
} from '../src/responses';

// Mock Express Response
const createMockResponse = (): Partial<Response> & {
  _status?: number;
  _data?: any;
  _headers?: any;
  _ended?: boolean;
  _redirectUrl?: string;
  _filePath?: string;
  _filename?: string;
} => {
  const mock: any = {
    _status: undefined,
    _data: undefined,
    _headers: {},
    _ended: false,
    _redirectUrl: undefined,
    _filePath: undefined,
    _filename: undefined,

    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockImplementation(function(data: any) {
      this._data = data;
      return this;
    }),
    send: jest.fn().mockImplementation(function(data: any) {
      this._data = data;
      return this;
    }),
    end: jest.fn().mockImplementation(function() {
      this._ended = true;
      return this;
    }),
    redirect: jest.fn().mockImplementation(function(url: string) {
      this._redirectUrl = url;
      return this;
    }),
    sendFile: jest.fn().mockImplementation(function(path: string, options?: any) {
      this._filePath = path;
      if (options?.headers?.['Content-Disposition']) {
        this._headers['Content-Disposition'] = options.headers['Content-Disposition'];
      }
      return this;
    }),
    download: jest.fn().mockImplementation(function(path: string, filename?: string) {
      this._filePath = path;
      if (filename) {
        this._filename = filename;
      }
      return this;
    })
  };

  // status 메서드가 호출될 때 _status 설정
  mock.status.mockImplementation(function(code: number) {
    this._status = code;
    return this;
  });

  return mock;
};

describe('Response Classes', () => {
  let mockRes: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  describe('JsonResponse', () => {
    it('should create JsonResponse with status code and data', () => {
      const response = new JsonResponse(200, { id: 1, name: 'test' });
      
      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual({ id: 1, name: 'test' });
    });

    it('should send JSON response correctly', () => {
      const data = { users: ['user1', 'user2'] };
      const response = new JsonResponse(200, data);
      
      response.send(mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(data);
    });

    it('should handle undefined data', () => {
      const response = new JsonResponse(204);
      
      response.send(mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith(undefined);
    });

    describe('Static convenience methods', () => {
      it('should create ok response', () => {
        const response = JsonResponse.ok({ message: 'success' });
        
        expect(response.statusCode).toBe(200);
        expect(response.data).toEqual({ message: 'success' });
      });

      it('should create created response', () => {
        const response = JsonResponse.created({ id: 1 });
        
        expect(response.statusCode).toBe(201);
        expect(response.data).toEqual({ id: 1 });
      });

      it('should create badRequest response', () => {
        const response = JsonResponse.badRequest({ error: 'Invalid input' });
        
        expect(response.statusCode).toBe(400);
        expect(response.data).toEqual({ error: 'Invalid input' });
      });

      it('should create unauthorized response', () => {
        const response = JsonResponse.unauthorized({ error: 'Unauthorized' });
        
        expect(response.statusCode).toBe(401);
        expect(response.data).toEqual({ error: 'Unauthorized' });
      });

      it('should create forbidden response', () => {
        const response = JsonResponse.forbidden({ error: 'Forbidden' });
        
        expect(response.statusCode).toBe(403);
        expect(response.data).toEqual({ error: 'Forbidden' });
      });

      it('should create notFound response', () => {
        const response = JsonResponse.notFound({ error: 'Not found' });
        
        expect(response.statusCode).toBe(404);
        expect(response.data).toEqual({ error: 'Not found' });
      });

      it('should create internalError response', () => {
        const response = JsonResponse.internalError({ error: 'Server error' });
        
        expect(response.statusCode).toBe(500);
        expect(response.data).toEqual({ error: 'Server error' });
      });
    });
  });

  describe('TextResponse', () => {
    it('should create TextResponse with status code and text', () => {
      const response = new TextResponse(200, 'Hello World');
      
      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('Hello World');
    });

    it('should send text response correctly', () => {
      const response = new TextResponse(200, 'Success message');
      
      response.send(mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith('Success message');
    });

    it('should handle undefined text', () => {
      const response = new TextResponse(200);
      
      response.send(mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith('');
    });

    describe('Static convenience methods', () => {
      it('should create ok response', () => {
        const response = TextResponse.ok('All good');
        
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('All good');
      });

      it('should create ok response with default text', () => {
        const response = TextResponse.ok();
        
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('OK');
      });

      it('should create created response', () => {
        const response = TextResponse.created('Resource created');
        
        expect(response.statusCode).toBe(201);
        expect(response.text).toBe('Resource created');
      });

      it('should create badRequest response', () => {
        const response = TextResponse.badRequest('Invalid data');
        
        expect(response.statusCode).toBe(400);
        expect(response.text).toBe('Invalid data');
      });

      it('should create unauthorized response', () => {
        const response = TextResponse.unauthorized();
        
        expect(response.statusCode).toBe(401);
        expect(response.text).toBe('Unauthorized');
      });

      it('should create forbidden response', () => {
        const response = TextResponse.forbidden();
        
        expect(response.statusCode).toBe(403);
        expect(response.text).toBe('Forbidden');
      });

      it('should create notFound response', () => {
        const response = TextResponse.notFound();
        
        expect(response.statusCode).toBe(404);
        expect(response.text).toBe('Not Found');
      });

      it('should create internalError response', () => {
        const response = TextResponse.internalError();
        
        expect(response.statusCode).toBe(500);
        expect(response.text).toBe('Internal Server Error');
      });
    });
  });

  describe('FileResponse', () => {
    it('should create FileResponse with file path', () => {
      const response = new FileResponse('/path/to/file.pdf');
      
      expect(response.statusCode).toBe(200);
      expect(response.filePath).toBe('/path/to/file.pdf');
      expect(response.filename).toBeUndefined();
      expect(response.asAttachment).toBe(false);
    });

    it('should create FileResponse with filename and attachment flag', () => {
      const response = new FileResponse('/path/to/file.pdf', 'document.pdf', true);
      
      expect(response.filePath).toBe('/path/to/file.pdf');
      expect(response.filename).toBe('document.pdf');
      expect(response.asAttachment).toBe(true);
    });

    it('should send file as attachment with filename', () => {
      const response = new FileResponse('/path/to/file.pdf', 'document.pdf', true);
      
      response.send(mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.download).toHaveBeenCalledWith('/path/to/file.pdf', 'document.pdf');
    });

    it('should send file as attachment without filename', () => {
      const response = new FileResponse('/path/to/file.pdf', undefined, true);
      
      response.send(mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.download).toHaveBeenCalledWith('/path/to/file.pdf');
    });

    it('should send file inline with filename', () => {
      const response = new FileResponse('/path/to/file.pdf', 'document.pdf', false);
      
      response.send(mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.sendFile).toHaveBeenCalledWith('/path/to/file.pdf', {
        headers: { 'Content-Disposition': 'inline; filename="document.pdf"' }
      });
    });

    it('should send file inline without filename', () => {
      const response = new FileResponse('/path/to/file.pdf');
      
      response.send(mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.sendFile).toHaveBeenCalledWith('/path/to/file.pdf');
    });

    describe('FileResponses convenience methods', () => {
      it('should create inline file response', () => {
        const response = FileResponses.inline('/path/to/file.pdf', 'document.pdf');
        
        expect(response.filePath).toBe('/path/to/file.pdf');
        expect(response.filename).toBe('document.pdf');
        expect(response.asAttachment).toBe(false);
      });

      it('should create attachment file response', () => {
        const response = FileResponses.attachment('/path/to/file.pdf', 'document.pdf');
        
        expect(response.filePath).toBe('/path/to/file.pdf');
        expect(response.filename).toBe('document.pdf');
        expect(response.asAttachment).toBe(true);
      });
    });
  });

  describe('NoContentResponse', () => {
    it('should create NoContentResponse with 204 status', () => {
      const response = new NoContentResponse();
      
      expect(response.statusCode).toBe(204);
    });

    it('should send 204 response correctly', () => {
      const response = new NoContentResponse();
      
      response.send(mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe('RedirectResponse', () => {
    it('should create temporary redirect by default', () => {
      const response = new RedirectResponse('/login');
      
      expect(response.statusCode).toBe(302);
      expect(response.url).toBe('/login');
    });

    it('should create permanent redirect when specified', () => {
      const response = new RedirectResponse('/new-path', true);
      
      expect(response.statusCode).toBe(301);
      expect(response.url).toBe('/new-path');
    });

    it('should create redirect with custom status code', () => {
      const response = new RedirectResponse('/path', 307);
      
      expect(response.statusCode).toBe(307);
      expect(response.url).toBe('/path');
    });

    it('should send redirect response correctly', () => {
      const response = new RedirectResponse('/login', 302);
      
      response.send(mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(302);
      expect(mockRes.redirect).toHaveBeenCalledWith('/login');
    });

    describe('RedirectResponses convenience methods', () => {
      it('should create temporary redirect', () => {
        const response = RedirectResponses.temporary('/login');
        
        expect(response.statusCode).toBe(302);
        expect(response.url).toBe('/login');
      });

      it('should create permanent redirect', () => {
        const response = RedirectResponses.permanent('/new-path');
        
        expect(response.statusCode).toBe(301);
        expect(response.url).toBe('/new-path');
      });

      it('should create temporary redirect preserving method', () => {
        const response = RedirectResponses.temporaryPreserveMethod('/submit');
        
        expect(response.statusCode).toBe(307);
        expect(response.url).toBe('/submit');
      });

      it('should create permanent redirect preserving method', () => {
        const response = RedirectResponses.permanentPreserveMethod('/new-submit');
        
        expect(response.statusCode).toBe(308);
        expect(response.url).toBe('/new-submit');
      });
    });
  });

  describe('BaseResponse inheritance', () => {
    it('should be instance of BaseResponse', () => {
      const jsonResponse = new JsonResponse(200, {});
      const textResponse = new TextResponse(200, 'text');
      const fileResponse = new FileResponse('/path');
      const noContentResponse = new NoContentResponse();
      const redirectResponse = new RedirectResponse('/path');
      
      expect(jsonResponse).toBeInstanceOf(BaseResponse);
      expect(textResponse).toBeInstanceOf(BaseResponse);
      expect(fileResponse).toBeInstanceOf(BaseResponse);
      expect(noContentResponse).toBeInstanceOf(BaseResponse);
      expect(redirectResponse).toBeInstanceOf(BaseResponse);
    });

    it('should have statusCode property', () => {
      const responses = [
        new JsonResponse(200, {}),
        new TextResponse(201, 'text'),
        new FileResponse('/path'),
        new NoContentResponse(),
        new RedirectResponse('/path')
      ];
      
      responses.forEach(response => {
        expect(typeof response.statusCode).toBe('number');
        expect(response.statusCode).toBeGreaterThan(0);
      });
    });

    it('should have send method', () => {
      const responses = [
        new JsonResponse(200, {}),
        new TextResponse(200, 'text'),
        new FileResponse('/path'),
        new NoContentResponse(),
        new RedirectResponse('/path')
      ];
      
      responses.forEach(response => {
        expect(typeof response.send).toBe('function');
      });
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for JsonResponse', () => {
      interface User {
        id: number;
        name: string;
      }
      
      const response = JsonResponse.ok<User>({ id: 1, name: 'John' });
      
      // TypeScript should ensure the data matches the User interface
      expect(response.data).toEqual({ id: 1, name: 'John' });
      expect(response.statusCode).toBe(200);
    });

    it('should maintain type safety for TextResponse', () => {
      const response = TextResponse.ok<'Success'>('Success');
      
      expect(response.text).toBe('Success');
      expect(response.statusCode).toBe(200);
    });

    it('should work without generic types', () => {
      const jsonResponse = JsonResponse.ok({ data: 'any' });
      const textResponse = TextResponse.ok('any text');
      
      expect(jsonResponse.data).toEqual({ data: 'any' });
      expect(textResponse.text).toBe('any text');
    });
  });
});