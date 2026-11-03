import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { ContractsModule } from '../contracts/contracts.module';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';

@Module({
  imports: [PrismaModule, ProjectsModule, ContractsModule],
  providers: [ExportService, ImportService],
  controllers: [ExportController, ImportController],
  exports: [ExportService, ImportService],
})
export class ImportExportModule {}
