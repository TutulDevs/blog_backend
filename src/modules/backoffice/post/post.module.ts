import { Module } from '@nestjs/common';
import { B_PostController } from './post.controller';
import { B_PostService } from './post.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [B_PostController],
  providers: [B_PostService],
})
export class B_PostModule {}
