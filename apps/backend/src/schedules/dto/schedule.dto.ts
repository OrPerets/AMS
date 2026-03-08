import { IsString, IsIn, IsOptional, IsInt, IsDateString, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import type { TaskType, TaskStatus, Priority, ScheduleStatus } from '@prisma/client';
import { PRIORITIES, SCHEDULE_STATUSES, TASK_STATUSES, TASK_TYPES } from '../../common/validation/prisma-enums';

export class CreateTaskDto {
  @IsOptional()
  @IsInt()
  assignedTo?: number;

  @IsIn(TASK_TYPES)
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

  @IsIn(PRIORITIES)
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
  @IsIn(SCHEDULE_STATUSES)
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
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsIn(PRIORITIES)
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
