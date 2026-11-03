import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { DocsModule } from './modules/docs/docs.module';
import { PlaygroundModule } from './modules/playground/playground.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { StorageModule } from './modules/storage/storage.module';
import { GeneratorModule } from './modules/generator/generator.module';
import { PlaceholderModule } from './modules/placeholder/placeholder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    WorkspacesModule,
    ProjectsModule,
    ContractsModule,
    DocsModule,
    PlaygroundModule,
    ImportExportModule,
    StorageModule,
    GeneratorModule,
    PlaceholderModule,
  ],
})
export class AppModule {}
