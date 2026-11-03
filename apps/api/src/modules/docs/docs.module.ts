import { Module } from '@nestjs/common';
import { DocsService } from './docs.service';
import { DocsController } from './docs.controller';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProjectsModule, AuthModule],
  controllers: [DocsController],
  providers: [DocsService],
  exports: [DocsService],
})
export class DocsModule {}
