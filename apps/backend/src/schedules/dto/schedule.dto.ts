import { IsString, IsEnum, IsOptional, IsInt, IsDateString, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskType, TaskStatus, Priority, ScheduleStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsOptional()
  @IsInt()
  assignedTo?: number;

  @IsEnum(TaskType)
  taskType!: TaskType;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  estimatedTime?: number;

  @IsEnum(Priority)
  priority!: Priority;

  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  endTime?: Date;

  @IsOptional()
  @IsInt()
  ticketId?: number;

  @IsOptional()
  @IsInt()
  workOrderId?: number;
}

export class CreateScheduleDto {
  @IsDateString()
  date!: Date;

  @IsOptional()
  @IsInt()
  buildingId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  tasks!: CreateTaskDto[];
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsDateString()
  date?: Date;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  assignedTo?: number;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  endTime?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StartTaskDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteTaskDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

