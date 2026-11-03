import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new workspace and make the user its OWNER.
   */
  async create(userId: string, dto: CreateWorkspaceDto) {
    const slug =
      dto.slug ||
      `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

    const existingSlug = await this.prisma.workspace.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException('A workspace with this slug already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          members: {
            create: {
              userId,
              role: WorkspaceRole.OWNER,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      });

      return workspace;
    });
  }

  /**
   * List all workspaces where the current user is a member.
   */
  async listUserWorkspaces(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { projects: true, members: true },
        },
        members: {
          where: { userId },
          select: { role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get workspace details by ID.
   */
  async getById(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            versions: {
              select: {
                id: true,
                semver: true,
                status: true,
                isLatest: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  /**
   * Update workspace metadata (ADMIN+).
   */
  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  /**
   * Delete workspace and all its cascading projects (OWNER only).
   */
  async delete(workspaceId: string) {
    return this.prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }

  /**
   * Invite member to workspace.
   */
  async inviteMember(workspaceId: string, dto: InviteMemberDto) {
    // Check if user is already a member
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email: dto.email.toLowerCase() },
      },
    });

    if (existingMember) {
      throw new ConflictException('This user is already a member of this workspace');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.workspaceInvitation.upsert({
      where: { token },
      create: {
        workspaceId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        token,
        expiresAt,
      },
      update: {
        role: dto.role,
        expiresAt,
      },
    });
  }

  /**
   * Remove member from workspace.
   */
  async removeMember(workspaceId: string, memberUserId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: memberUserId },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this workspace');
    }

    if (member.role === WorkspaceRole.OWNER) {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: { workspaceId, role: WorkspaceRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the only owner of a workspace');
      }
    }

    return this.prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: { workspaceId, userId: memberUserId },
      },
    });
  }
}
