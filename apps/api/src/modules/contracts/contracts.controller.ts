import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { CreateReusableSchemaDto } from './dto/create-schema.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Contracts & Endpoints')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  // ===================== FOLDERS =====================

  @Post('versions/:versionId/folders')
  @ApiOperation({ summary: 'Create an organizational folder for endpoints' })
  async createFolder(
    @Param('versionId') versionId: string,
    @Body() dto: CreateFolderDto,
  ) {
    const folder = await this.contractsService.createFolder(versionId, dto);
    return { success: true, data: folder };
  }

  @Get('versions/:versionId/folders')
  @ApiOperation({ summary: 'List all folders within an API version' })
  async listFolders(@Param('versionId') versionId: string) {
    const folders = await this.contractsService.listFolders(versionId);
    return { success: true, data: folders };
  }

  @Delete('folders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a folder' })
  async deleteFolder(@Param('id') id: string) {
    await this.contractsService.deleteFolder(id);
    return { success: true, message: 'Folder deleted' };
  }

  // ===================== ENDPOINTS =====================

  @Post('versions/:versionId/endpoints')
  @ApiOperation({ summary: 'Create a new API endpoint definition' })
  @ApiResponse({ status: 201, description: 'Endpoint created successfully' })
  async createEndpoint(
    @Param('versionId') versionId: string,
    @Body() dto: CreateEndpointDto,
  ) {
    const endpoint = await this.contractsService.createEndpoint(versionId, dto);
    return { success: true, data: endpoint };
  }

  @Get('endpoints/:id')
  @ApiOperation({ summary: 'Get details of an endpoint definition' })
  async getEndpoint(@Param('id') id: string) {
    const endpoint = await this.contractsService.getEndpoint(id);
    return { success: true, data: endpoint };
  }

  @Patch('endpoints/:id')
  @ApiOperation({ summary: 'Update an endpoint definition (DRAFT versions only)' })
  async updateEndpoint(
    @Param('id') id: string,
    @Body() dto: Partial<CreateEndpointDto>,
  ) {
    const endpoint = await this.contractsService.updateEndpoint(id, dto);
    return { success: true, data: endpoint };
  }

  @Delete('endpoints/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an endpoint definition' })
  async deleteEndpoint(@Param('id') id: string) {
    await this.contractsService.deleteEndpoint(id);
    return { success: true, message: 'Endpoint deleted' };
  }

  @Post('endpoints/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing endpoint' })
  async duplicateEndpoint(@Param('id') id: string) {
    const duplicate = await this.contractsService.duplicateEndpoint(id);
    return { success: true, data: duplicate };
  }

  // ===================== REUSABLE SCHEMAS =====================

  @Post('versions/:versionId/schemas')
  @ApiOperation({ summary: 'Create a reusable schema component ($ref component)' })
  async createSchema(
    @Param('versionId') versionId: string,
    @Body() dto: CreateReusableSchemaDto,
  ) {
    const schema = await this.contractsService.createSchema(versionId, dto);
    return { success: true, data: schema };
  }

  @Get('versions/:versionId/schemas')
  @ApiOperation({ summary: 'List reusable schema components in a version' })
  async listSchemas(@Param('versionId') versionId: string) {
    const schemas = await this.contractsService.listSchemas(versionId);
    return { success: true, data: schemas };
  }

  @Delete('schemas/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a reusable schema component' })
  async deleteSchema(@Param('id') id: string) {
    await this.contractsService.deleteSchema(id);
    return { success: true, message: 'Schema deleted' };
  }
}
