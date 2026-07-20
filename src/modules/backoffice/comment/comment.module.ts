import { Module } from '@nestjs/common';
import { B_CommentController } from './comment.controller';
import { B_CommentService } from './comment.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [B_CommentController],
  providers: [B_CommentService],
})
export class B_CommentModule {}
