import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { VersionStatus, Prisma } from '@prisma/client';
import { CanonicalContract } from '@apiforge/shared';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new API project with an initial version and default environment.
   */
  async create(workspaceId: string, dto: CreateProjectDto) {
    const slug =
      dto.slug ||
      `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;

    const existing = await this.prisma.project.findUnique({
      where: {
        workspaceId_slug: { workspaceId, slug },
      },
    });

    if (existing) {
      throw new ConflictException('A project with this slug already exists in this workspace');
    }

    const semver = dto.initialVersion || '1.0.0';

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          workspaceId,
          name: dto.name,
          slug,
          description: dto.description,
          versions: {
            create: {
              semver,
              status: VersionStatus.DRAFT,
              isLatest: true,
              metadata: {
                description: dto.description || '',
              },
            },
          },
          environments: {
            create: {
              name: 'Development',
              baseUrl: 'http://localhost:3000/api',
              variables: [],
            },
          },
        },
        include: {
          versions: true,
          environments: true,
        },
      });

      return project;
    });
  }

  /**
   * List all projects within a workspace.
   */
  async listWorkspaceProjects(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        versions: {
          where: { isLatest: true },
          select: {
            id: true,
            semver: true,
            status: true,
            _count: { select: { endpoints: true, schemas: true } },
          },
        },
        environments: {
          select: { id: true, name: true, baseUrl: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get single project details by ID.
   */
  async getById(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { endpoints: true, folders: true, schemas: true } },
          },
        },
        environments: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * Add a new environment to a project.
   */
  async addEnvironment(projectId: string, dto: CreateEnvironmentDto) {
    const existing = await this.prisma.environment.findUnique({
      where: {
        projectId_name: { projectId, name: dto.name },
      },
    });

    if (existing) {
      throw new ConflictException(`Environment '${dto.name}' already exists in this project`);
    }

    return this.prisma.environment.create({
      data: {
        projectId,
        name: dto.name,
        baseUrl: dto.baseUrl,
        variables: dto.variables as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Create a new semantic version (optionally cloning an existing version).
   */
  async createVersion(projectId: string, dto: CreateVersionDto) {
    const existing = await this.prisma.projectVersion.findUnique({
      where: {
        projectId_semver: { projectId, semver: dto.semver },
      },
    });

    if (existing) {
      throw new ConflictException(`Version '${dto.semver}' already exists in this project`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Mark other versions as not latest
      await tx.projectVersion.updateMany({
        where: { projectId },
        data: { isLatest: false },
      });

      const newVersion = await tx.projectVersion.create({
        data: {
          projectId,
          semver: dto.semver,
          status: VersionStatus.DRAFT,
          isLatest: true,
        },
      });

      // Clone from existing version if requested
      if (dto.cloneFromVersionId) {
        const sourceFolders = await tx.folder.findMany({
          where: { versionId: dto.cloneFromVersionId },
        });

        const folderIdMap = new Map<string, string>();
        for (const folder of sourceFolders) {
          const createdFolder = await tx.folder.create({
            data: {
              versionId: newVersion.id,
              name: folder.name,
              description: folder.description,
              orderIndex: folder.orderIndex,
            },
          });
          folderIdMap.set(folder.id, createdFolder.id);
        }

        const sourceEndpoints = await tx.endpoint.findMany({
          where: { versionId: dto.cloneFromVersionId },
        });

        for (const ep of sourceEndpoints) {
          await tx.endpoint.create({
            data: {
              versionId: newVersion.id,
              folderId: ep.folderId ? folderIdMap.get(ep.folderId) || null : null,
              method: ep.method,
              path: ep.path,
              summary: ep.summary,
              description: ep.description,
              tags: ep.tags,
              deprecated: ep.deprecated,
              parameters: ep.parameters as Prisma.InputJsonValue,
              requestBody: ep.requestBody as Prisma.InputJsonValue,
              responses: ep.responses as Prisma.InputJsonValue,
              security: ep.security as Prisma.InputJsonValue,
              orderIndex: ep.orderIndex,
            },
          });
        }

        const sourceSchemas = await tx.reusableSchema.findMany({
          where: { versionId: dto.cloneFromVersionId },
        });

        for (const sch of sourceSchemas) {
          await tx.reusableSchema.create({
            data: {
              versionId: newVersion.id,
              name: sch.name,
              description: sch.description,
              schema: sch.schema as Prisma.InputJsonValue,
            },
          });
        }
      }

      return newVersion;
    });
  }

  /**
   * Publish a version, locking it from further mutations.
   */
  async publishVersion(versionId: string) {
    const version = await this.prisma.projectVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.status === VersionStatus.PUBLISHED) {
      throw new BadRequestException('Version is already published and immutable');
    }

    return this.prisma.projectVersion.update({
      where: { id: versionId },
      data: {
        status: VersionStatus.PUBLISHED,
      },
    });
  }

  /**
   * Assemble and retrieve the complete Canonical Contract AST for a version.
   */
  async getCanonicalContract(versionId: string): Promise<CanonicalContract> {
    const version = await this.prisma.projectVersion.findUnique({
      where: { id: versionId },
      include: {
        project: {
          include: {
            environments: true,
          },
        },
        folders: { orderBy: { orderIndex: 'asc' } },
        endpoints: { orderBy: { orderIndex: 'asc' } },
        schemas: true,
        security: true,
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    const reusableSchemas: Record<string, any> = {};
    version.schemas.forEach((s) => {
      reusableSchemas[s.name] = s.schema;
    });

    const securitySchemes: Record<string, any> = {};
    version.security.forEach((sec) => {
      securitySchemes[sec.name] = {
        id: sec.id,
        name: sec.name,
        type: sec.type,
        scheme: sec.scheme,
        in: sec.inField,
        paramName: sec.paramName,
        description: sec.description,
      };
    });

    return {
      id: version.id,
      name: version.project.name,
      version: version.semver,
      description: version.project.description || undefined,
      servers: version.project.environments.map((env) => ({
        id: env.id,
        url: env.baseUrl,
        description: env.name,
      })),
      tags: [],
      folders: version.folders.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description || undefined,
        orderIndex: f.orderIndex,
      })),
      endpoints: version.endpoints.map((ep) => ({
        id: ep.id,
        folderId: ep.folderId,
        method: ep.method,
        path: ep.path,
        summary: ep.summary,
        description: ep.description || undefined,
        tags: ep.tags,
        deprecated: ep.deprecated,
        security: (ep.security as any) || [],
        parameters: (ep.parameters as any) || [],
        requestBody: (ep.requestBody as any) || undefined,
        responses: (ep.responses as any) || [],
        orderIndex: ep.orderIndex,
      })),
      reusableSchemas,
      securitySchemes,
    };
  }
}
