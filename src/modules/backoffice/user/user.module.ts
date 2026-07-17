import { Module } from '@nestjs/common';
import { B_UserController } from './user.controller';
import { B_UserService } from './user.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [B_UserController],
  providers: [B_UserService],
})
export class B_UserModule {}
