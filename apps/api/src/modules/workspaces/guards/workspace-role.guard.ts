import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  [WorkspaceRole.OWNER]: 4,
  [WorkspaceRole.ADMIN]: 3,
  [WorkspaceRole.EDITOR]: 2,
  [WorkspaceRole.VIEWER]: 1,
};

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Resolve workspace ID from params: :workspaceId or :id
    const workspaceId = request.params.workspaceId || request.params.id;
    if (!workspaceId) {
      // If endpoint is not workspace-scoped, allow pass-through
      return true;
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    request.workspace = membership.workspace;
    request.workspaceMember = membership;

    // If no specific roles required, membership alone suffices
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const userRoleWeight = ROLE_HIERARCHY[membership.role];
    const hasRole = requiredRoles.some((role) => userRoleWeight >= ROLE_HIERARCHY[role]);

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
