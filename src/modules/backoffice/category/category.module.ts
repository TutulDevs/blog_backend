import { Module } from '@nestjs/common';
import { B_CategoryController } from './category.controller';
import { B_CategoryService } from './category.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [B_CategoryController],
  providers: [B_CategoryService],
})
export class B_CategoryModule {}
