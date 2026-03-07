import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateWorkOrderPhotosDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}
