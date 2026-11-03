import {
  Controller,
  Post,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ProjectsService } from '../projects/projects.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { ZipPackagingService } from './zip-packaging.service';
import { CanonicalContract } from '@apiforge/shared';

@ApiTags('Generator & Packaging')
@Controller('generator')
export class GeneratorController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly zipPackaging: ZipPackagingService,
  ) {}

  @Post(':versionId/pdf')
  @ApiOperation({ summary: 'Generate standalone PDF/print-ready documentation manual' })
  @ApiParam({ name: 'versionId', description: 'Project Version UUID' })
  async generatePdf(@Param('versionId') versionId: string) {
    const contract = (await this.projectsService.getCanonicalContract(versionId)) as CanonicalContract;
    if (!contract) {
      throw new NotFoundException('Project version not found');
    }
    return this.pdfGenerator.generatePdfArtifact(contract);
  }

  @Post(':versionId/zip')
  @ApiOperation({ summary: 'Package complete archive with OpenAPI JSON/YAML, Postman Collection, and Docs' })
  @ApiParam({ name: 'versionId', description: 'Project Version UUID' })
  async packageZip(@Param('versionId') versionId: string) {
    const contract = (await this.projectsService.getCanonicalContract(versionId)) as CanonicalContract;
    if (!contract) {
      throw new NotFoundException('Project version not found');
    }
    return this.zipPackaging.packageCompleteZip(contract);
  }
}
