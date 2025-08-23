import { Role } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class ImpersonateDto {
  @IsEnum(Role)
  role: Role;

  @IsInt()
  tenantId: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
