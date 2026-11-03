import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HttpMethod } from '@prisma/client';

export class ExecuteRequestDto {
  @ApiProperty({ enum: HttpMethod, example: HttpMethod.GET })
  @IsEnum(HttpMethod)
  method!: HttpMethod;

  @ApiProperty({ example: 'https://httpbin.org/get' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^https?:\/\//i, {
    message: "Target URL must begin with 'http://' or 'https://'",
  })
  url!: string;

  @ApiPropertyOptional({ example: { 'Accept': 'application/json' } })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ example: { 'page': '1' } })
  @IsOptional()
  @IsObject()
  queryParams?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  body?: any;

  @ApiPropertyOptional({ example: [{ key: 'baseUrl', value: 'https://api.acme.com' }] })
  @IsOptional()
  @IsArray()
  variables?: Array<{ key: string; value: string }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endpointId?: string;
}
