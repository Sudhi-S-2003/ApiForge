import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReusableSchemaDto {
  @ApiProperty({ example: 'User' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: 'Schema name must only contain alphanumeric characters and underscores',
  })
  name!: string;

  @ApiPropertyOptional({ example: 'User entity schema definition' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
      },
      required: ['id', 'email'],
    },
  })
  @IsNotEmpty()
  schema!: Record<string, unknown>;
}
