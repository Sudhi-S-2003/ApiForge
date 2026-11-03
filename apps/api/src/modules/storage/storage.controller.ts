import {
  Controller,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { StorageService } from './storage.service';

@ApiTags('Storage Vault')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('download/:token')
  @ApiOperation({ summary: 'Stream downloaded artifact using an opaque token' })
  @ApiParam({ name: 'token', description: 'Opaque 64-character hex download token' })
  async downloadArtifact(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const { stream, metadata } = await this.storageService.getFileStreamByToken(token);

    res.setHeader('Content-Type', metadata.mimeType);
    res.setHeader('Content-Length', metadata.sizeBytes);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(metadata.originalFilename)}"`,
    );

    stream.pipe(res);
  }
}
