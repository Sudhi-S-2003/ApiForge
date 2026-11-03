import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EnvironmentVariableDto {
  @ApiProperty({ example: 'apiKey' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ example: 'sk_live_99823482' })
  @IsString()
  value!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isSecret = false;
}

export class CreateEnvironmentDto {
  @ApiProperty({ example: 'Production' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'https://api.acme.com/v1' })
  @IsString()
  @IsNotEmpty()
  baseUrl!: string;

  @ApiProperty({ type: [EnvironmentVariableDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnvironmentVariableDto)
  variables: EnvironmentVariableDto[] = [];
}
