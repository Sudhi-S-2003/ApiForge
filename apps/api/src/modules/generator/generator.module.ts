import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ProjectsModule } from '../projects/projects.module';
import { PdfGeneratorService } from './pdf-generator.service';
import { ZipPackagingService } from './zip-packaging.service';
import { GeneratorController } from './generator.controller';

@Module({
  imports: [StorageModule, ProjectsModule],
  providers: [PdfGeneratorService, ZipPackagingService],
  controllers: [GeneratorController],
  exports: [PdfGeneratorService, ZipPackagingService],
})
export class GeneratorModule {}
