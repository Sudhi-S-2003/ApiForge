import { Module } from '@nestjs/common';
import { PlaceholderController } from './placeholder.controller';
import { PlaceholderService } from './placeholder.service';
import { PlaceholderAuthGuard } from './placeholder.guard';

@Module({
  controllers: [PlaceholderController],
  providers: [PlaceholderService, PlaceholderAuthGuard],
  exports: [PlaceholderService],
})
export class PlaceholderModule {}
