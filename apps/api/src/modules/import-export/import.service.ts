import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { importOpenApi, importPostman, ImportResult } from '@apiforge/shared';
import { VersionStatus, Prisma, HttpMethod } from '@prisma/client';

export interface IngestionResult {
  versionId: string;
  format: string;
  endpointsImported: number;
  schemasImported: number;
  warnings: string[];
  unsupportedFeatures: string[];
}

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: locates an editable draft version or creates a new draft version.
   */
  private async getOrCreateEditableDraft(projectId: string): Promise<string> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Look for existing draft
    const existingDraft = project.versions.find((v) => v.status === VersionStatus.DRAFT);
    if (existingDraft) {
      return existingDraft.id;
    }

    // If all versions are published, create a new draft version e.g. 0.1.0 or next minor
    const latestVersion = project.versions[0];
    let nextSemver = '0.1.0';
    if (latestVersion) {
      const parts = latestVersion.semver.split('.').map(Number);
      if (parts.length === 3 && !isNaN(parts[1])) {
        nextSemver = `${parts[0]}.${parts[1] + 1}.0`;
      }
    }

    const newDraft = await this.prisma.projectVersion.create({
      data: {
        projectId,
        semver: nextSemver,
        status: VersionStatus.DRAFT,
      },
    });

    return newDraft.id;
  }

  /**
   * Ingests parsed CanonicalContract AST into PostgreSQL via Prisma transaction
   */
  private async persistImportedContract(
    projectId: string,
    parsed: ImportResult,
  ): Promise<IngestionResult> {
    const versionId = await this.getOrCreateEditableDraft(projectId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Persist Reusable Schemas
      let schemasImported = 0;
      for (const [schemaName, schemaObj] of Object.entries(parsed.contract.reusableSchemas || {})) {
        await tx.reusableSchema.upsert({
          where: {
            versionId_name: { versionId, name: schemaName },
          },
          create: {
            versionId,
            name: schemaName,
            description: (schemaObj as any)?.description || null,
            schema: schemaObj as Prisma.InputJsonValue,
          },
          update: {
            schema: schemaObj as Prisma.InputJsonValue,
            description: (schemaObj as any)?.description || null,
          },
        });
        schemasImported++;
      }

      // 2. Persist Folders (from tags)
      const folderMap = new Map<string, string>();
      const allTags = new Set<string>();
      parsed.contract.endpoints.forEach((ep) => {
        (ep.tags || []).forEach((t) => allTags.add(t));
      });

      let fIdx = 0;
      for (const tag of allTags) {
        let folder = await tx.folder.findFirst({
          where: { versionId, name: tag },
        });

        if (!folder) {
          folder = await tx.folder.create({
            data: {
              versionId,
              name: tag,
              orderIndex: fIdx++,
            },
          });
        }
        folderMap.set(tag, folder.id);
      }

      // 3. Persist Endpoints
      let endpointsImported = 0;
      for (const ep of parsed.contract.endpoints) {
        const primaryTag = ep.tags && ep.tags.length > 0 ? ep.tags[0] : null;
        const folderId = primaryTag ? folderMap.get(primaryTag) || null : null;

        // Map method to valid Prisma HttpMethod enum
        const method = ep.method.toUpperCase() as HttpMethod;

        await tx.endpoint.create({
          data: {
            versionId,
            folderId,
            method,
            path: ep.path,
            summary: ep.summary || `${ep.method} ${ep.path}`,
            description: ep.description || null,
            tags: ep.tags || [],
            deprecated: !!ep.deprecated,
            parameters: ep.parameters as unknown as Prisma.InputJsonValue,
            requestBody: (ep.requestBody || null) as unknown as Prisma.InputJsonValue,
            responses: ep.responses as unknown as Prisma.InputJsonValue,
            security: ep.security as unknown as Prisma.InputJsonValue,
            orderIndex: ep.orderIndex || endpointsImported,
          },
        });
        endpointsImported++;
      }

      return {
        versionId,
        format: parsed.format,
        endpointsImported,
        schemasImported,
        warnings: parsed.warnings,
        unsupportedFeatures: parsed.unsupportedFeatures,
      };
    });
  }

  /**
   * Import OpenAPI 3.x / Swagger 2.0 (JSON or YAML)
   */
  async importOpenApi(projectId: string, content: string): Promise<IngestionResult> {
    if (!content || !content.trim()) {
      throw new BadRequestException('Import content cannot be empty');
    }

    let parsed: ImportResult;
    try {
      parsed = importOpenApi(content);
    } catch (err: any) {
      throw new BadRequestException(`Failed to parse OpenAPI document: ${err.message}`);
    }

    return this.persistImportedContract(projectId, parsed);
  }

  /**
   * Import Postman Collection v2.0 / v2.1 JSON
   */
  async importPostman(projectId: string, content: string): Promise<IngestionResult> {
    if (!content || !content.trim()) {
      throw new BadRequestException('Import content cannot be empty');
    }

    let parsed: ImportResult;
    try {
      parsed = importPostman(content);
    } catch (err: any) {
      throw new BadRequestException(`Failed to parse Postman collection: ${err.message}`);
    }

    return this.persistImportedContract(projectId, parsed);
  }
}
