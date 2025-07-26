const express = require('express');
const { 
  Controller, 
  Get, 
  Post, 
  Delete,
  JsonResponse,
  TextResponse,
  NoContentResponse,
  RedirectResponse,
  RedirectResponses,
  registerControllers
} = require('./dist/index.js');

// 간단한 테스트 컨트롤러 (JavaScript로 작성, 데코레이터 없이)
class TestController {
  constructor() {
    // Controller metadata 수동 설정
    this.constructor._metadata = {
      controller: { path: '/test', middlewares: [] },
      routes: [
        { path: '/json', method: 'GET', middlewares: [], propertyKey: 'testJson' },
        { path: '/text', method: 'GET', middlewares: [], propertyKey: 'testText' },
        { path: '/nocontent', method: 'DELETE', middlewares: [], propertyKey: 'testNoContent' },
        { path: '/redirect', method: 'GET', middlewares: [], propertyKey: 'testRedirect' }
      ]
    };
  }

  async testJson(req, res, next) {
    console.log('Testing JsonResponse...');
    return new JsonResponse(200, { 
      message: 'Hello from JsonResponse!', 
      timestamp: new Date().toISOString() 
    });
  }

  async testText(req, res, next) {
    console.log('Testing TextResponse...');
    return new TextResponse(200, 'Hello from TextResponse!');
  }

  async testNoContent(req, res, next) {
    console.log('Testing NoContentResponse...');
    return new NoContentResponse();
  }

  async testRedirect(req, res, next) {
    console.log('Testing RedirectResponse...');
    return new RedirectResponse('/test/json', 302);
  }
}

// 테스트 함수들
function testResponseInstantiation() {
  console.log('\\n=== Testing Response Class Instantiation ===');
  
  // JsonResponse 테스트
  const jsonResp = new JsonResponse(200, { test: 'data' });
  console.log('✓ JsonResponse created:', jsonResp.statusCode, jsonResp.data);
  
  // JsonResponse static convenience methods 테스트
  const jsonOk = JsonResponse.ok({ message: 'OK' });
  const jsonError = JsonResponse.badRequest({ error: 'Bad Request' });
  console.log('✓ JsonResponse.ok:', jsonOk.statusCode);
  console.log('✓ JsonResponse.badRequest:', jsonError.statusCode);

  // TextResponse 테스트
  const textResp = new TextResponse(200, 'Hello World');
  console.log('✓ TextResponse created:', textResp.statusCode, textResp.text);

  // TextResponse static convenience methods 테스트
  const textOk = TextResponse.ok('All good');
  console.log('✓ TextResponse.ok:', textOk.statusCode, textOk.text);

  // NoContentResponse 테스트
  const noContentResp = new NoContentResponse();
  console.log('✓ NoContentResponse created:', noContentResp.statusCode);

  // RedirectResponse 테스트
  const redirectResp = new RedirectResponse('/new-path', 302);
  console.log('✓ RedirectResponse created:', redirectResp.statusCode, redirectResp.url);

  // RedirectResponses convenience methods 테스트
  const permanentRedirect = RedirectResponses.permanent('/permanent-path');
  console.log('✓ RedirectResponses.permanent:', permanentRedirect.statusCode, permanentRedirect.url);
}

function startExpressServer() {
  console.log('\\n=== Starting Express Server ===');
  
  const app = express();
  app.use(express.json());

  // 수동으로 라우트 설정 (실제 컨트롤러 시스템 사용하지 않고 직접 테스트)
  app.get('/test/json', async (req, res) => {
    try {
      const response = new JsonResponse(200, { 
        message: 'Hello from JsonResponse!', 
        timestamp: new Date().toISOString() 
      });
      response.send(res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/test/text', async (req, res) => {
    try {
      const response = new TextResponse(200, 'Hello from TextResponse!');
      response.send(res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/test/nocontent', async (req, res) => {
    try {
      const response = new NoContentResponse();
      response.send(res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/test/redirect', async (req, res) => {
    try {
      const response = new RedirectResponse('/test/json', 302);
      response.send(res);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const port = 8201;
  app.listen(port, () => {
    console.log(`✓ Express server started on port ${port}`);
    console.log('\\nTest the endpoints:');
    console.log(`  curl http://localhost:${port}/test/json`);
    console.log(`  curl http://localhost:${port}/test/text`);
    console.log(`  curl -X DELETE http://localhost:${port}/test/nocontent`);
    console.log(`  curl http://localhost:${port}/test/redirect`);
    console.log('\\nPress Ctrl+C to stop the server');
  });
}

// 테스트 실행
console.log('🚀 Testing Express Controller Response System');

try {
  testResponseInstantiation();
  startExpressServer();
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}
