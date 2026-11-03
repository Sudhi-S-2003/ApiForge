import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlaceholderAuthGuard } from './placeholder.guard';
import { PlaceholderService, PlaceholderItem } from './placeholder.service';

@ApiTags('Placeholder API')
@ApiBearerAuth()
@UseGuards(PlaceholderAuthGuard)
@Controller('placeholder')
export class PlaceholderController {
  constructor(private readonly placeholderService: PlaceholderService) {}

  @Get('me')
  @ApiOperation({ summary: 'Verify Bearer token and get current authenticated user profile' })
  getProfile(@Req() req: any) {
    return {
      authenticated: true,
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('items')
  @ApiOperation({ summary: 'List placeholder items (optional ?category= filter)' })
  findAll(@Query('category') category?: string): PlaceholderItem[] {
    return this.placeholderService.findAll(category);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a placeholder item by ID' })
  findById(@Param('id') id: string): PlaceholderItem {
    return this.placeholderService.findById(id);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new placeholder item' })
  create(@Body() body: Partial<PlaceholderItem>, @Req() req: any): PlaceholderItem {
    return this.placeholderService.create(body, req.user);
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Update an existing placeholder item' })
  update(@Param('id') id: string, @Body() body: Partial<PlaceholderItem>): PlaceholderItem {
    return this.placeholderService.update(id, body);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete a placeholder item by ID' })
  delete(@Param('id') id: string) {
    return this.placeholderService.delete(id);
  }

  // Campaigns sub-resource placeholder
  @Get('campaigns')
  @ApiOperation({ summary: 'List placeholder campaigns' })
  findAllCampaigns(): PlaceholderItem[] {
    return this.placeholderService.findAll('campaign');
  }

  @Post('campaigns')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new placeholder campaign' })
  createCampaign(@Body() body: any, @Req() req: any): PlaceholderItem {
    return this.placeholderService.create(
      {
        ...body,
        category: 'campaign',
      },
      req.user,
    );
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete a placeholder campaign by ID' })
  deleteCampaign(@Param('id') id: string) {
    return this.placeholderService.delete(id);
  }
}
