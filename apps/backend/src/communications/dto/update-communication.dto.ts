import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateCommunicationDto {
  @IsOptional()
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @IsInt()
  unitId?: number;

  @IsOptional()
  @IsInt()
  senderId?: number;

  @IsOptional()
  @IsInt()
  recipientId?: number;

  @IsOptional()
  @IsInt()
  maintenanceScheduleId?: number;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
