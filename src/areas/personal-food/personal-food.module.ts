// Feature F16: Food Preference & Allergen Profile
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreferenceProfile } from './models/preference-profile.entity';
import { PreferenceService } from './services/preference.service';
import { PreferenceController } from './controllers/preference.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PreferenceProfile])],
  controllers: [PreferenceController],
  providers: [PreferenceService],
  exports: [PreferenceService],
})
export class PersonalFoodModule {}

