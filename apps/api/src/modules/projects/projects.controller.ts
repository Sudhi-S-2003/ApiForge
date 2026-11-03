import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import { Roles } from '../workspaces/decorators/roles.decorator';
import { WorkspaceRole } from '@prisma/client';

@ApiTags('Projects & Versions')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('workspaces/:workspaceId/projects')
  @UseGuards(WorkspaceRoleGuard)
  @Roles(WorkspaceRole.EDITOR)
  @ApiOperation({ summary: 'Create a new API project within a workspace (EDITOR+)' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateProjectDto,
  ) {
    const project = await this.projectsService.create(workspaceId, dto);
    return {
      success: true,
      data: project,
    };
  }

  @Get('workspaces/:workspaceId/projects')
  @UseGuards(WorkspaceRoleGuard)
  @Roles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'List all API projects within a workspace' })
  async listWorkspaceProjects(@Param('workspaceId') workspaceId: string) {
    const projects = await this.projectsService.listWorkspaceProjects(workspaceId);
    return {
      success: true,
      data: projects,
    };
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get API project details, versions, and environments' })
  async getById(@Param('id') id: string) {
    const project = await this.projectsService.getById(id);
    return {
      success: true,
      data: project,
    };
  }

  @Post('projects/:id/environments')
  @ApiOperation({ summary: 'Add a new environment with base URL and variables' })
  async addEnvironment(
    @Param('id') id: string,
    @Body() dto: CreateEnvironmentDto,
  ) {
    const env = await this.projectsService.addEnvironment(id, dto);
    return {
      success: true,
      data: env,
    };
  }

  @Post('projects/:id/versions')
  @ApiOperation({ summary: 'Create a new semantic version (draft or clone)' })
  async createVersion(
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
  ) {
    const version = await this.projectsService.createVersion(id, dto);
    return {
      success: true,
      data: version,
    };
  }

  @Post('versions/:versionId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish an API version and lock it as immutable' })
  async publishVersion(@Param('versionId') versionId: string) {
    const version = await this.projectsService.publishVersion(versionId);
    return {
      success: true,
      data: version,
      message: 'Version has been successfully published and is now immutable',
    };
  }

  @Get('versions/:versionId/contract')
  @ApiOperation({ summary: 'Get complete compiled Canonical Contract AST for a version' })
  async getCanonicalContract(@Param('versionId') versionId: string) {
    const contract = await this.projectsService.getCanonicalContract(versionId);
    return {
      success: true,
      data: contract,
    };
  }
}
