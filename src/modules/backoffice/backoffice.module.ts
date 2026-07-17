import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { B_AuthController } from './auth/b_auth.controller';
import { B_AuthService } from './auth/b_auth.service';
import { StaffModule } from './staff/staff.module';

@Module({
  imports: [AuthModule, StaffModule],
  controllers: [B_AuthController],
  providers: [B_AuthService],
})
export class BackofficeModule {}
