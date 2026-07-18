import { Module } from '@nestjs/common';
import { F_UserController } from './user.controller';
import { F_UserService } from './user.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [F_UserController],
  providers: [F_UserService],
})
export class F_UserModule {}
