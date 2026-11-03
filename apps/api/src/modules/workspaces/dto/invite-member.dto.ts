import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';

export class InviteMemberDto {
  @ApiProperty({ example: 'colleague@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ enum: WorkspaceRole, default: WorkspaceRole.EDITOR })
  @IsEnum(WorkspaceRole, { message: 'Invalid workspace role' })
  role: WorkspaceRole = WorkspaceRole.EDITOR;
}
