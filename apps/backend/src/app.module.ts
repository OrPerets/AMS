import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { BuildingModule } from './buildings/building.module';
import { UnitModule } from './units/unit.module';

@Module({
  imports: [AuthModule, UserModule, BuildingModule, UnitModule],
})
export class AppModule {}
