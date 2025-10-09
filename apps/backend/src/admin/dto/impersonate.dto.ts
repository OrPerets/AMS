import { Role } from '../../auth/roles.decorator';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class ImpersonateDto {
  @IsEnum(Role)
  role!: Role;

  @IsInt()
  tenantId!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
