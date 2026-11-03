import { Module } from '@nestjs/common';
import { PlaygroundService } from './playground.service';
import { PlaygroundController } from './playground.controller';
import { SsrfGuardService } from './ssrf-guard.service';

@Module({
  controllers: [PlaygroundController],
  providers: [PlaygroundService, SsrfGuardService],
  exports: [PlaygroundService, SsrfGuardService],
})
export class PlaygroundModule {}
