import { IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Payments & Billing API' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ example: 'payments-api' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase alphanumeric characters and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'Core API contracts for payment gateways and billing webhooks' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional()
  @IsString()
  initialVersion?: string;
}
