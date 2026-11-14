// Feature F06: Food safety documents & licence verification
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyLicenceDto {
  @IsNotEmpty({ message: 'Licence number is required' })
  @IsString()
  @MaxLength(100)
  licenceNumber: string;
}
