import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateWorkOrderPhotosDto {
  @IsArray()
  @IsString({ each: true })
  photos!: string[];

  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}
