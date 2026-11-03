import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DocsService, PublishDocDto } from './docs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Documentation Portal')
@Controller()
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get('docs/:slug')
  @ApiOperation({ summary: 'Retrieve public or password-protected documentation portal by slug' })
  @ApiResponse({ status: 200, description: 'Documentation retrieved successfully' })
  async getBySlug(
    @Param('slug') slug: string,
    @Query('password') password?: string,
  ) {
    const data = await this.docsService.getBySlug(slug, password);
    return {
      success: true,
      data,
    };
  }

  @Post('projects/:projectId/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish project version as live documentation portal (EDITOR+)' })
  async publish(
    @Param('projectId') projectId: string,
    @Body() dto: PublishDocDto,
  ) {
    const doc = await this.docsService.publish(projectId, dto);
    return {
      success: true,
      data: doc,
      message: 'Documentation successfully published',
    };
  }
}
