import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { HashService } from '../auth/hash.service';
import { VersionStatus, Prisma } from '@prisma/client';

export interface PublishDocDto {
  versionId: string;
  slug: string;
  title: string;
  introMarkdown?: string;
  gettingStartedMarkdown?: string;
  isPublic?: boolean;
  password?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

@Injectable()
export class DocsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly hashService: HashService,
  ) {}

  /**
   * Publish a project version as a live documentation portal.
   */
  async publish(projectId: string, dto: PublishDocDto) {
    const version = await this.prisma.projectVersion.findUnique({
      where: { id: dto.versionId },
      include: { project: true },
    });

    if (!version || version.projectId !== projectId) {
      throw new NotFoundException('Project version not found');
    }

    const existingSlug = await this.prisma.publishedDoc.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug && existingSlug.versionId !== dto.versionId) {
      throw new ConflictException(`Documentation slug '${dto.slug}' is already taken`);
    }

    let passwordHash: string | null = null;
    if (dto.password) {
      passwordHash = await this.hashService.hash(dto.password);
    }

    // Mark version as published (immutable) and create/update published doc record
    return this.prisma.$transaction(async (tx) => {
      await tx.projectVersion.update({
        where: { id: dto.versionId },
        data: { status: VersionStatus.PUBLISHED },
      });

      const doc = await tx.publishedDoc.upsert({
        where: { versionId: dto.versionId },
        create: {
          versionId: dto.versionId,
          slug: dto.slug,
          title: dto.title || version.project.name,
          introMarkdown: dto.introMarkdown || version.project.description || '',
          gettingStartedMarkdown: dto.gettingStartedMarkdown || '',
          isPublic: dto.isPublic !== false,
          passwordHash,
          branding: (dto.branding || {}) as Prisma.InputJsonValue,
        },
        update: {
          slug: dto.slug,
          title: dto.title || version.project.name,
          introMarkdown: dto.introMarkdown || version.project.description || '',
          gettingStartedMarkdown: dto.gettingStartedMarkdown || '',
          isPublic: dto.isPublic !== false,
          ...(passwordHash && { passwordHash }),
          branding: (dto.branding || {}) as Prisma.InputJsonValue,
        },
      });

      return doc;
    });
  }

  /**
   * Retrieve published documentation and its full Canonical AST by slug.
   */
  async getBySlug(slug: string, password?: string) {
    const doc = await this.prisma.publishedDoc.findUnique({
      where: { slug },
      include: {
        version: {
          include: {
            project: {
              include: {
                environments: true,
              },
            },
          },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException('Documentation portal not found');
    }

    // Password verification for protected docs
    if (doc.passwordHash) {
      if (!password) {
        throw new UnauthorizedException('This documentation portal is password-protected');
      }
      const isValid = await this.hashService.verify(doc.passwordHash, password);
      if (!isValid) {
        throw new UnauthorizedException('Incorrect password');
      }
    }

    const contract = await this.projectsService.getCanonicalContract(doc.versionId);

    return {
      doc: {
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        introMarkdown: doc.introMarkdown,
        gettingStartedMarkdown: doc.gettingStartedMarkdown,
        branding: doc.branding,
        updatedAt: doc.updatedAt,
      },
      contract,
      environments: doc.version.project.environments.map((e) => ({
        id: e.id,
        name: e.name,
        baseUrl: e.baseUrl,
      })),
    };
  }
}
