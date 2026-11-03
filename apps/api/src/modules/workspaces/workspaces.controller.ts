import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceRole } from '@prisma/client';

@ApiTags('Workspaces')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    const workspace = await this.workspacesService.create(userId, dto);
    return {
      success: true,
      data: workspace,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all workspaces for the authenticated user' })
  async listUserWorkspaces(@CurrentUser('id') userId: string) {
    const workspaces = await this.workspacesService.listUserWorkspaces(userId);
    return {
      success: true,
      data: workspaces,
    };
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  @Roles(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Get workspace details by ID' })
  async getById(@Param('id') id: string) {
    const workspace = await this.workspacesService.getById(id);
    return {
      success: true,
      data: workspace,
    };
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @Roles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Update workspace metadata (ADMIN+)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    const workspace = await this.workspacesService.update(id, dto);
    return {
      success: true,
      data: workspace,
    };
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @Roles(WorkspaceRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a workspace (OWNER only)' })
  async delete(@Param('id') id: string) {
    await this.workspacesService.delete(id);
    return {
      success: true,
      message: 'Workspace successfully deleted',
    };
  }

  @Post(':id/members/invite')
  @UseGuards(WorkspaceRoleGuard)
  @Roles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Invite a member to the workspace (ADMIN+)' })
  async inviteMember(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
  ) {
    const invitation = await this.workspacesService.inviteMember(id, dto);
    return {
      success: true,
      data: invitation,
    };
  }

  @Delete(':id/members/:userId')
  @UseGuards(WorkspaceRoleGuard)
  @Roles(WorkspaceRole.ADMIN)
  @ApiOperation({ summary: 'Remove a member from the workspace (ADMIN+)' })
  async removeMember(
    @Param('id') workspaceId: string,
    @Param('userId') memberUserId: string,
  ) {
    await this.workspacesService.removeMember(workspaceId, memberUserId);
    return {
      success: true,
      message: 'Member successfully removed',
    };
  }
}
