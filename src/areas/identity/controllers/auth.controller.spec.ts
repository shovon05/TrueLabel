import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';

describe('AuthController (Unit Tests)', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLoginPage', () => {
    it('should return page title and user', () => {
      const mockReq = { session: { user: null } } as any;
      const res = controller.getLoginPage(mockReq);
      expect(res).toEqual({
        title: 'Sign In — TrueLabel',
        user: null,
      });
    });
  });

  describe('handleLogin', () => {
    it('should authenticate user and redirect to /catalog on success', async () => {
      const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com', role: 'consumer' as const };
      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);

      const mockReq = { session: {} } as any;
      const mockRes = {
        redirect: jest.fn(),
        render: jest.fn(),
      } as any;

      await controller.handleLogin(
        { email: 'alice@example.com', password: 'password123' },
        mockReq,
        mockRes,
      );

      expect(mockReq.session.user).toEqual(mockUser);
      expect(mockRes.redirect).toHaveBeenCalledWith('/catalog');
    });

    it('should render login page with error on invalid credentials', async () => {
      (authService.validateUser as jest.Mock).mockRejectedValue(new Error('Invalid email or password'));

      const mockReq = { session: {} } as any;
      const mockRes = {
        redirect: jest.fn(),
        render: jest.fn(),
      } as any;

      await controller.handleLogin(
        { email: 'alice@example.com', password: 'wrong' },
        mockReq,
        mockRes,
      );

      expect(mockRes.render).toHaveBeenCalledWith(
        'areas/identity/views/login',
        expect.objectContaining({
          error: 'Invalid email or password',
          email: 'alice@example.com',
        }),
      );
    });
  });
});

