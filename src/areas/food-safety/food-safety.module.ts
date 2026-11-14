// Feature F06: Food safety documents & licence verification
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodSafetyDocument } from './models/food-safety-document.entity';
import { ManufacturerLicence } from './models/manufacturer-licence.entity';
import { DocumentService } from './services/document.service';
import { SafetyDocumentController } from './controllers/safety-document.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FoodSafetyDocument, ManufacturerLicence]),
  ],
  controllers: [SafetyDocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class FoodSafetyModule {}
