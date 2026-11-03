import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, WorkspaceRoleGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}
