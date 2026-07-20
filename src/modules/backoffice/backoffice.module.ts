import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { B_AuthController } from './auth/b_auth.controller';
import { B_AuthService } from './auth/b_auth.service';
import { StaffModule } from './staff/staff.module';
import { B_UserModule } from './user/user.module';
import { B_CategoryModule } from './category/category.module';
import { B_PostModule } from './post/post.module';
import { B_CommentModule } from './comment/comment.module';

@Module({
  imports: [
    AuthModule,
    StaffModule,
    B_UserModule,
    B_CategoryModule,
    B_PostModule,
    B_CommentModule,
  ],
  controllers: [B_AuthController],
  providers: [B_AuthService],
})
export class BackofficeModule {}
