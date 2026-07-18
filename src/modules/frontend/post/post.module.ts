import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { AuthModule } from 'src/modules/auth/auth.module';
import { F_CommentModule } from '../comment/comment.module';

@Module({
  imports: [AuthModule, F_CommentModule],
  controllers: [PostController],
  providers: [PostService],
})
export class F_PostModule {}
