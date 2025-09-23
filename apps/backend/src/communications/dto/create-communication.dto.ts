import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCommunicationDto {
  @IsOptional()
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @IsInt()
  unitId?: number;

  @IsInt()
  senderId!: number;

  @IsOptional()
  @IsInt()
  recipientId?: number;

  @IsOptional()
  @IsInt()
  maintenanceScheduleId?: number;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
