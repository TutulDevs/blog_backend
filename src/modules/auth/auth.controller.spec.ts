import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  StaffForgotPasswordDto,
  StaffLoginDto,
  StaffRegisterDto,
  StaffResetPasswordDto,
} from './dto/auth_staff.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            staffLogin: jest.fn(),
            staffRegister: jest.fn(),
            staffForgotPassword: jest.fn(),
            staffResetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('staffLogin', () => {
    it('delegates to authService.staffLogin with the dto and returns its result', async () => {
      const dto: StaffLoginDto = {
        email: 'admin@email.com',
        password: 'password123',
      };
      const result = {
        accessToken: 'token',
        staff: {
          id: 1,
          email: dto.email,
          name: 'Admin',
          role: 1,
          status: 1,
        },
      };
      authService.staffLogin.mockResolvedValue(result);

      await expect(controller.staffLogin(dto)).resolves.toBe(result);
      expect(authService.staffLogin).toHaveBeenCalledWith(dto);
      expect(authService.staffLogin).toHaveBeenCalledTimes(1);
    });

    it('propagates errors thrown by authService.staffLogin', async () => {
      const dto: StaffLoginDto = {
        email: 'admin@email.com',
        password: 'wrong',
      };
      const error = new Error('Invalid email or password');
      authService.staffLogin.mockRejectedValue(error);

      await expect(controller.staffLogin(dto)).rejects.toThrow(error);
    });
  });

  describe('staffRegister', () => {
    it('delegates to authService.staffRegister with the dto and returns its result', async () => {
      const dto: StaffRegisterDto = {
        email: 'new@email.com',
        password: 'password123',
        name: 'New Staff',
        role: 1,
        status: 1,
      };
      const result = { id: 1, email: dto.email };
      authService.staffRegister.mockResolvedValue(result);

      await expect(controller.staffRegister(dto)).resolves.toBe(result);
      expect(authService.staffRegister).toHaveBeenCalledWith(dto);
      expect(authService.staffRegister).toHaveBeenCalledTimes(1);
    });

    it('propagates errors thrown by authService.staffRegister', async () => {
      const dto: StaffRegisterDto = {
        email: 'existing@email.com',
        password: 'password123',
        name: 'Existing',
        role: 1,
        status: 1,
      };
      const error = new Error(
        'An account with this email address already exists.',
      );
      authService.staffRegister.mockRejectedValue(error);

      await expect(controller.staffRegister(dto)).rejects.toThrow(error);
    });
  });

  describe('staffForgotPassword', () => {
    it('delegates to authService.staffForgotPassword with the dto and returns its result', async () => {
      const dto: StaffForgotPasswordDto = { email: 'admin@email.com' };
      const result = {
        message: 'If that email is registered, a reset code has been sent',
      };
      authService.staffForgotPassword.mockResolvedValue(result);

      await expect(controller.staffForgotPassword(dto)).resolves.toBe(result);
      expect(authService.staffForgotPassword).toHaveBeenCalledWith(dto);
      expect(authService.staffForgotPassword).toHaveBeenCalledTimes(1);
    });

    it('propagates errors thrown by authService.staffForgotPassword', async () => {
      const dto: StaffForgotPasswordDto = { email: 'admin@email.com' };
      const error = new Error('unexpected failure');
      authService.staffForgotPassword.mockRejectedValue(error);

      await expect(controller.staffForgotPassword(dto)).rejects.toThrow(error);
    });
  });

  describe('staffResetPassword', () => {
    it('delegates to authService.staffResetPassword with the dto and returns its result', async () => {
      const dto: StaffResetPasswordDto = {
        email: 'admin@email.com',
        password: 'newpassword123',
        resetCode: '123456',
      };
      const result = { message: 'Reset password successful' };
      authService.staffResetPassword.mockResolvedValue(result);

      await expect(controller.staffResetPassword(dto)).resolves.toBe(result);
      expect(authService.staffResetPassword).toHaveBeenCalledWith(dto);
      expect(authService.staffResetPassword).toHaveBeenCalledTimes(1);
    });

    it('propagates errors thrown by authService.staffResetPassword', async () => {
      const dto: StaffResetPasswordDto = {
        email: 'admin@email.com',
        password: 'newpassword123',
        resetCode: '000000',
      };
      const error = new Error('Invalid or expired reset code');
      authService.staffResetPassword.mockRejectedValue(error);

      await expect(controller.staffResetPassword(dto)).rejects.toThrow(error);
    });
  });
});
