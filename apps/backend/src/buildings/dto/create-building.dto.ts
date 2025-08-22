import { IsInt, IsString } from 'class-validator';

export class CreateBuildingDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsInt()
  tenantId: number;
}
