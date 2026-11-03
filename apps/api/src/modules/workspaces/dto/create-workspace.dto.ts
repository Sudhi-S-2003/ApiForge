import { IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Acme Engineering' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ example: 'acme-eng' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase alphanumeric characters and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'API projects and contract specs for Acme teams' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
