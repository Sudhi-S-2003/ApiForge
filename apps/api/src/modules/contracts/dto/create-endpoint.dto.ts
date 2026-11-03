import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HttpMethod } from '@prisma/client';

export class CreateEndpointDto {
  @ApiPropertyOptional({ example: 'folder-uuid-123' })
  @IsOptional()
  @IsString()
  folderId?: string;

  @ApiProperty({ enum: HttpMethod, example: HttpMethod.GET })
  @IsEnum(HttpMethod)
  method!: HttpMethod;

  @ApiProperty({ example: '/api/v1/users/{id}' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\//, { message: "Path must start with a forward slash '/'" })
  path!: string;

  @ApiProperty({ example: 'Retrieve user by ID' })
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @ApiPropertyOptional({ example: 'Returns full profile details for the requested user.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['Users', 'Core'] })
  @IsOptional()
  @IsArray()
  tags: string[] = [];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  deprecated = false;

  @ApiPropertyOptional({
    example: [
      {
        id: 'p-1',
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  parameters: any[] = [];

  @ApiPropertyOptional()
  @IsOptional()
  requestBody?: any;

  @ApiPropertyOptional({
    example: [
      {
        id: 'r-1',
        statusCode: '200',
        description: 'User details',
        content: {
          'application/json': {
            schema: { type: 'object', properties: { id: { type: 'string' } } },
          },
        },
      },
    ],
  })
  @IsArray()
  responses: any[] = [];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  security?: any[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  orderIndex = 0;
}
