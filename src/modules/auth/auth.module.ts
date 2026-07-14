import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { B_AuthController } from './b_auth.controller';
import { B_AuthService } from './b_auth.service';
import { F_AuthController } from './f_auth.controller';
import { F_AuthService } from './f_auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_EXPIRES_IN',
            '5m',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [B_AuthController, F_AuthController],
  providers: [B_AuthService, F_AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
