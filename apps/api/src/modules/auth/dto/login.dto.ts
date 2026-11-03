import { IsEmail, IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'developer@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ example: true, description: 'Whether to issue a 30-day Remember-Me token' })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}

export class RememberLoginDto {
  @ApiProperty({ description: 'Long-lived 30-day Remember-Me JWT' })
  @IsString()
  @IsNotEmpty()
  rememberToken!: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsString()
  @IsOptional()
  userId?: string;
}
