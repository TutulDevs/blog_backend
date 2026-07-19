import { Test, TestingModule } from '@nestjs/testing';
import { F_AuthController } from './f_auth.controller';
import { F_AuthService } from './f_auth.service';
import {
  UserLoginDto,
  UserRegisterDto,
  UserVerifyEmailDto,
} from './dto/auth_user.dto';

describe('F_AuthController', () => {
  let controller: F_AuthController;
  let authService: jest.Mocked<F_AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [F_AuthController],
      providers: [
        {
          provide: F_AuthService,
          useValue: {
            userRegister: jest.fn(),
            userVerifyEmail: jest.fn(),
            userLogin: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(F_AuthController);
    authService = module.get(F_AuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('userRegister', () => {
    it('delegates to authService.userRegister with the dto and returns its result', async () => {
      const dto: UserRegisterDto = {
        username: 'johndoe',
        email: 'john@email.com',
        password: 'password123',
        name: 'John Doe',
      };
      const result = { message: 'User registered successfully' };
      authService.userRegister.mockResolvedValue(result);

      await expect(controller.userRegister(dto)).resolves.toBe(result);
      expect(authService.userRegister).toHaveBeenCalledWith(dto);
      expect(authService.userRegister).toHaveBeenCalledTimes(1);
    });

    it('propagates errors thrown by authService.userRegister', async () => {
      const dto: UserRegisterDto = {
        username: 'johndoe',
        email: 'existing@email.com',
        password: 'password123',
      };
      const error = new Error(
        'An account with this email or username already exists.',
      );
      authService.userRegister.mockRejectedValue(error);

      await expect(controller.userRegister(dto)).rejects.toThrow(error);
    });
  });

  describe('userVerifyEmail', () => {
    it('delegates to authService.userVerifyEmail with the dto and returns its result', async () => {
      const dto: UserVerifyEmailDto = {
        email: 'john@email.com',
        verifyCode: '123456',
      };
      const result = { message: 'Email verified successfully' };
      authService.userVerifyEmail.mockResolvedValue(result);

      await expect(controller.userVerifyEmail(dto)).resolves.toBe(result);
      expect(authService.userVerifyEmail).toHaveBeenCalledWith(dto);
      expect(authService.userVerifyEmail).toHaveBeenCalledTimes(1);
    });

    it('propagates errors thrown by authService.userVerifyEmail', async () => {
      const dto: UserVerifyEmailDto = {
        email: 'john@email.com',
        verifyCode: '000000',
      };
      const error = new Error('Invalid or expired verification code');
      authService.userVerifyEmail.mockRejectedValue(error);

      await expect(controller.userVerifyEmail(dto)).rejects.toThrow(error);
    });
  });

  describe('userLogin', () => {
    it('delegates to authService.userLogin with the dto and returns its result', async () => {
      const dto: UserLoginDto = {
        identifier: 'john@email.com',
        password: 'password123',
      };
      const result = {
        message: 'Login successful',
        accessToken: 'token',
        user: {
          id: 1,
          username: 'johndoe',
          email: 'john@email.com',
          name: 'John Doe',
          status: 1,
        },
      };
      authService.userLogin.mockResolvedValue(result);

      await expect(controller.userLogin(dto)).resolves.toBe(result);
      expect(authService.userLogin).toHaveBeenCalledWith(dto);
      expect(authService.userLogin).toHaveBeenCalledTimes(1);
    });

    it('propagates errors thrown by authService.userLogin', async () => {
      const dto: UserLoginDto = {
        identifier: 'john@email.com',
        password: 'wrong',
      };
      const error = new Error('Invalid email or password');
      authService.userLogin.mockRejectedValue(error);

      await expect(controller.userLogin(dto)).rejects.toThrow(error);
    });
  });
});
