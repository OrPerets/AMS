import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsDateString, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VoteType } from '@prisma/client';

export class CreateVoteDto {
  @IsInt()
  buildingId!: number;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  question!: string;

  @IsEnum(VoteType)
  voteType!: VoteType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[]; // For MULTIPLE_CHOICE

  @IsDateString()
  endDate!: Date;

  @IsOptional()
  @IsBoolean()
  requireAllVotes?: boolean;
}

export class CastVoteDto {
  @IsOptional()
  @IsInt()
  optionId?: number; // For MULTIPLE_CHOICE

  @IsOptional()
  @IsBoolean()
  response?: boolean; // For YES_NO

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number; // For RATING (1-5)

  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateVoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

