import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { CreateReusableSchemaDto } from './dto/create-schema.dto';
import { VersionStatus, Prisma } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: verify that a version exists and is in DRAFT status (not locked/published).
   */
  private async ensureVersionEditable(versionId: string) {
    const version = await this.prisma.projectVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    if (version.status === VersionStatus.PUBLISHED) {
      throw new BadRequestException(
        'Cannot modify this version because it has already been published as immutable. Create a new semantic version (e.g. 1.1.0) to make changes.',
      );
    }

    return version;
  }

  // ===================== FOLDERS =====================

  async createFolder(versionId: string, dto: CreateFolderDto) {
    await this.ensureVersionEditable(versionId);

    return this.prisma.folder.create({
      data: {
        versionId,
        name: dto.name,
        description: dto.description,
        orderIndex: dto.orderIndex || 0,
      },
    });
  }

  async listFolders(versionId: string) {
    return this.prisma.folder.findMany({
      where: { versionId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async deleteFolder(folderId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    await this.ensureVersionEditable(folder.versionId);

    return this.prisma.folder.delete({
      where: { id: folderId },
    });
  }

  // ===================== ENDPOINTS =====================

  async createEndpoint(versionId: string, dto: CreateEndpointDto) {
    await this.ensureVersionEditable(versionId);

    // Check for duplicate method + path within the version
    const existing = await this.prisma.endpoint.findFirst({
      where: {
        versionId,
        method: dto.method,
        path: dto.path,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Endpoint '${dto.method} ${dto.path}' already exists in this version`,
      );
    }

    return this.prisma.endpoint.create({
      data: {
        versionId,
        folderId: dto.folderId || null,
        method: dto.method,
        path: dto.path,
        summary: dto.summary,
        description: dto.description,
        tags: dto.tags || [],
        deprecated: dto.deprecated || false,
        parameters: (dto.parameters || []) as Prisma.InputJsonValue,
        requestBody: (dto.requestBody || null) as Prisma.InputJsonValue,
        responses: (dto.responses || []) as Prisma.InputJsonValue,
        security: (dto.security || []) as Prisma.InputJsonValue,
        orderIndex: dto.orderIndex || 0,
      },
    });
  }

  async getEndpoint(endpointId: string) {
    const endpoint = await this.prisma.endpoint.findUnique({
      where: { id: endpointId },
      include: {
        folder: { select: { id: true, name: true } },
      },
    });

    if (!endpoint) {
      throw new NotFoundException('Endpoint not found');
    }

    return endpoint;
  }

  async updateEndpoint(endpointId: string, dto: Partial<CreateEndpointDto>) {
    const endpoint = await this.prisma.endpoint.findUnique({
      where: { id: endpointId },
    });
    if (!endpoint) throw new NotFoundException('Endpoint not found');
    await this.ensureVersionEditable(endpoint.versionId);

    return this.prisma.endpoint.update({
      where: { id: endpointId },
      data: {
        ...(dto.folderId !== undefined && { folderId: dto.folderId || null }),
        ...(dto.method && { method: dto.method }),
        ...(dto.path && { path: dto.path }),
        ...(dto.summary && { summary: dto.summary }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.deprecated !== undefined && { deprecated: dto.deprecated }),
        ...(dto.parameters && { parameters: dto.parameters as Prisma.InputJsonValue }),
        ...(dto.requestBody !== undefined && {
          requestBody: dto.requestBody as Prisma.InputJsonValue,
        }),
        ...(dto.responses && { responses: dto.responses as Prisma.InputJsonValue }),
        ...(dto.security && { security: dto.security as Prisma.InputJsonValue }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
      },
    });
  }

  async deleteEndpoint(endpointId: string) {
    const endpoint = await this.prisma.endpoint.findUnique({
      where: { id: endpointId },
    });
    if (!endpoint) throw new NotFoundException('Endpoint not found');
    await this.ensureVersionEditable(endpoint.versionId);

    return this.prisma.endpoint.delete({
      where: { id: endpointId },
    });
  }

  async duplicateEndpoint(endpointId: string) {
    const original = await this.prisma.endpoint.findUnique({
      where: { id: endpointId },
    });
    if (!original) throw new NotFoundException('Endpoint not found');
    await this.ensureVersionEditable(original.versionId);

    const duplicatePath = `${original.path}-copy`;

    return this.prisma.endpoint.create({
      data: {
        versionId: original.versionId,
        folderId: original.folderId,
        method: original.method,
        path: duplicatePath,
        summary: `${original.summary} (Copy)`,
        description: original.description,
        tags: original.tags,
        deprecated: original.deprecated,
        parameters: original.parameters as Prisma.InputJsonValue,
        requestBody: original.requestBody as Prisma.InputJsonValue,
        responses: original.responses as Prisma.InputJsonValue,
        security: original.security as Prisma.InputJsonValue,
        orderIndex: original.orderIndex + 1,
      },
    });
  }

  // ===================== REUSABLE SCHEMAS =====================

  async createSchema(versionId: string, dto: CreateReusableSchemaDto) {
    await this.ensureVersionEditable(versionId);

    const existing = await this.prisma.reusableSchema.findUnique({
      where: {
        versionId_name: { versionId, name: dto.name },
      },
    });

    if (existing) {
      throw new ConflictException(`Schema '${dto.name}' already exists in this version`);
    }

    return this.prisma.reusableSchema.create({
      data: {
        versionId,
        name: dto.name,
        description: dto.description,
        schema: dto.schema as Prisma.InputJsonValue,
      },
    });
  }

  async listSchemas(versionId: string) {
    return this.prisma.reusableSchema.findMany({
      where: { versionId },
      orderBy: { name: 'asc' },
    });
  }

  async deleteSchema(schemaId: string) {
    const schema = await this.prisma.reusableSchema.findUnique({
      where: { id: schemaId },
    });
    if (!schema) throw new NotFoundException('Schema not found');
    await this.ensureVersionEditable(schema.versionId);

    return this.prisma.reusableSchema.delete({
      where: { id: schemaId },
    });
  }
}
