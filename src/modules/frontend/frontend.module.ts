import { Module } from '@nestjs/common';
import { F_UserModule } from './user/user.module';
import { F_AuthController } from './auth/f_auth.controller';
import { F_AuthService } from './auth/f_auth.service';
import { AuthModule } from '../auth/auth.module';
import { F_PostModule } from './post/post.module';
import { F_CategoryModule } from './category/category.module';
import { F_CommentModule } from './comment/comment.module';

@Module({
  imports: [
    AuthModule,
    F_UserModule,
    F_PostModule,
    F_CategoryModule,
    F_CommentModule,
  ],
  controllers: [F_AuthController],
  providers: [F_AuthService],
})
export class FrontendModule {}
