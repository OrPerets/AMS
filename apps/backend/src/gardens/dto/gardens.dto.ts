import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export class CreateGardensMonthDto {
  @Matches(MONTH_PATTERN)
  plan!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsDateString()
  submissionDeadline?: string;
}

export class ReviewGardensPlanDto {
  @IsIn(['APPROVED', 'NEEDS_CHANGES'])
  status!: 'APPROVED' | 'NEEDS_CHANGES';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}

export class GardensAssignmentInputDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @IsString()
  @MaxLength(160)
  location!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class SaveGardensAssignmentsDto {
  @IsArray()
  @ArrayMaxSize(62)
  @ValidateNested({ each: true })
  @Type(() => GardensAssignmentInputDto)
  assignments!: GardensAssignmentInputDto[];
}

export class SendGardensRemindersDto {
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  workerProfileIds?: number[];

  @IsOptional()
  @IsBoolean()
  onlyPending?: boolean;
}
