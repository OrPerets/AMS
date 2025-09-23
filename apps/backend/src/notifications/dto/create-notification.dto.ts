import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  tenantId?: number;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
