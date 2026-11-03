import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import {
  exportToOpenApiJson,
  exportToOpenApiYaml,
  exportToPostmanJson,
  CanonicalContract,
} from '@apiforge/shared';

@Injectable()
export class ExportService {
  constructor(private readonly projectsService: ProjectsService) {}

  async getOpenApiJson(versionId: string): Promise<string> {
    const contract = (await this.projectsService.getCanonicalContract(versionId)) as CanonicalContract;
    if (!contract) {
      throw new NotFoundException('Version contract not found');
    }
    return exportToOpenApiJson(contract, true);
  }

  async getOpenApiYaml(versionId: string): Promise<string> {
    const contract = (await this.projectsService.getCanonicalContract(versionId)) as CanonicalContract;
    if (!contract) {
      throw new NotFoundException('Version contract not found');
    }
    return exportToOpenApiYaml(contract);
  }

  async getPostmanJson(versionId: string): Promise<string> {
    const contract = (await this.projectsService.getCanonicalContract(versionId)) as CanonicalContract;
    if (!contract) {
      throw new NotFoundException('Version contract not found');
    }
    return exportToPostmanJson(contract, true);
  }
}
