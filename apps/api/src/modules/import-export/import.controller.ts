import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImportService } from './import.service';
import { IsNotEmpty, IsString } from 'class-validator';

export class ImportPayloadDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}

@ApiTags('Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post(':projectId/openapi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import OpenAPI 3.x / Swagger 2.0 (JSON or YAML) specification into project' })
  async importOpenApi(
    @Param('projectId') projectId: string,
    @Body() body: ImportPayloadDto,
  ) {
    return this.importService.importOpenApi(projectId, body.content);
  }

  @Post(':projectId/postman')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import Postman Collection v2.1 JSON into project' })
  async importPostman(
    @Param('projectId') projectId: string,
    @Body() body: ImportPayloadDto,
  ) {
    return this.importService.importPostman(projectId, body.content);
  }
}
