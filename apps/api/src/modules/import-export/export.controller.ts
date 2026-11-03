import {
  Controller,
  Get,
  Param,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';

@ApiTags('Export')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get(':versionId/openapi/json')
  @ApiOperation({ summary: 'Export version contract to OpenAPI 3.1.0 JSON format' })
  @ApiProduces('application/json')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="openapi.json"')
  async exportOpenApiJson(
    @Param('versionId') versionId: string,
    @Res() res: Response,
  ) {
    const jsonStr = await this.exportService.getOpenApiJson(versionId);
    return res.send(jsonStr);
  }

  @Get(':versionId/openapi/yaml')
  @ApiOperation({ summary: 'Export version contract to OpenAPI 3.1.0 YAML format' })
  @ApiProduces('application/x-yaml')
  @Header('Content-Type', 'application/x-yaml')
  @Header('Content-Disposition', 'attachment; filename="openapi.yaml"')
  async exportOpenApiYaml(
    @Param('versionId') versionId: string,
    @Res() res: Response,
  ) {
    const yamlStr = await this.exportService.getOpenApiYaml(versionId);
    return res.send(yamlStr);
  }

  @Get(':versionId/postman')
  @ApiOperation({ summary: 'Export version contract to Postman Collection v2.1.0 JSON format' })
  @ApiProduces('application/json')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="postman_collection.json"')
  async exportPostman(
    @Param('versionId') versionId: string,
    @Res() res: Response,
  ) {
    const postmanJson = await this.exportService.getPostmanJson(versionId);
    return res.send(postmanJson);
  }
}
