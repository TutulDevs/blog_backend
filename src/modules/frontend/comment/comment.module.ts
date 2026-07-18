import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class F_CommentModule {}
