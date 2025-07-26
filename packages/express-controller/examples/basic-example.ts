import express from 'express';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Use,
  Authenticated,
  registerControllers
} from '../src/index';

// 미들웨어 예제
const loggingMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
};

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // 간단한 토큰 검증 (실제로는 JWT 등을 사용)
  if (token !== 'Bearer valid-token') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// DTO 인터페이스
interface CreateUserDto {
  name: string;
  email: string;
  age?: number;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
  age?: number;
}

// 사용자 컨트롤러 - Modern Decorator with direct parameter access
@Controller({ path: '/users', middlewares: [loggingMiddleware] })
export class UserController {
  // 모든 사용자 조회
  @Get()
  async getUsers(req: express.Request, res: express.Response, next: express.NextFunction) {
    const page = req.query.page as string || '1';
    const limit = req.query.limit as string || '10';
    
    const users = [
      { id: '1', name: 'John Doe', email: 'john@example.com', age: 30 },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25 }
    ];

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.length
      }
    };
  }

  // 특정 사용자 조회
  @Get('/:id')
  async getUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    
    if (id === '1') {
      return { id: '1', name: 'John Doe', email: 'john@example.com', age: 30 };
    }
    if (id === '2') {
      return { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25 };
    }
    
    res.status(404);
    return { error: 'User not found' };
  }

  // 사용자 생성
  @Post()
  @Use(authMiddleware) // 인증 필요
  async createUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const userData = req.body as CreateUserDto;
    
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString()
    };

    console.log('Creating user:', newUser);
    return { user: newUser, message: 'User created successfully' };
  }

  // 사용자 수정
  @Put('/:id')
  @Authenticated(authMiddleware) // 인증 데코레이터 사용
  async updateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    const userData = req.body as UpdateUserDto;
    
    const updatedUser = {
      id,
      ...userData,
      updatedAt: new Date().toISOString()
    };

    console.log('Updating user:', updatedUser);
    return { user: updatedUser, message: 'User updated successfully' };
  }

  // 사용자 삭제
  @Delete('/:id')
  @Authenticated(authMiddleware)
  async deleteUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    
    console.log('Deleting user with ID:', id);
    return { message: 'User deleted successfully', id };
  }

  // 보호된 프로필 정보
  @Get('/profile/me')
  @Authenticated(authMiddleware)
  async getProfile(req: express.Request, res: express.Response, next: express.NextFunction) {
    return {
      id: 'current-user',
      name: 'Current User',
      email: 'current@example.com',
      role: 'user'
    };
  }
}

// 포스트 컨트롤러 - Modern Decorator with direct parameter access
@Controller('/posts')
export class PostController {
  @Get()
  async getPosts(req: express.Request, res: express.Response, next: express.NextFunction) {
    const userId = req.query.userId as string;
    
    const posts = [
      { id: '1', title: 'First Post', content: 'Hello World!', userId: '1' },
      { id: '2', title: 'Second Post', content: 'TypeScript is great!', userId: '2' }
    ];

    if (userId) {
      return { posts: posts.filter(post => post.userId === userId) };
    }

    return { posts };
  }

  @Get('/:id')
  async getPost(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    const post = { id, title: 'Sample Post', content: 'This is a sample post.' };
    return { post };
  }

  @Post()
  @Use(authMiddleware)
  async createPost(req: express.Request, res: express.Response, next: express.NextFunction) {
    const postData = req.body as { title: string; content: string };
    
    const newPost = {
      id: Date.now().toString(),
      ...postData,
      userId: 'current-user',
      createdAt: new Date().toISOString()
    };

    return { post: newPost, message: 'Post created successfully' };
  }
}

// Express 앱 설정
const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 컨트롤러 등록
registerControllers(app, [UserController, PostController], '/api');

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'ts5deco Express Controller Framework Example',
    endpoints: {
      users: '/api/users',
      posts: '/api/posts'
    }
  });
});

// 에러 핸들링 미들웨어
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /api/users');
  console.log('- GET /api/users/:id');
  console.log('- POST /api/users (requires auth)');
  console.log('- PUT /api/users/:id (requires auth)');
  console.log('- DELETE /api/users/:id (requires auth)');
  console.log('- GET /api/users/profile/me (requires auth)');
  console.log('- GET /api/posts');
  console.log('- POST /api/posts (requires auth)');
  console.log('');
  console.log('For protected routes, use header: Authorization: Bearer valid-token');
});

export default app;
