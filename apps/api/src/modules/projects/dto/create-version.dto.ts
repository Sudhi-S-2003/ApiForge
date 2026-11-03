import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVersionDto {
  @ApiProperty({ example: '1.1.0' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/, {
    message: 'Version must follow semantic versioning format (e.g. 1.0.0, 1.1.0-beta.1)',
  })
  semver!: string;

  @ApiPropertyOptional({ example: 'Clone from version ID e.g. 1.0.0' })
  @IsOptional()
  @IsString()
  cloneFromVersionId?: string;
}
