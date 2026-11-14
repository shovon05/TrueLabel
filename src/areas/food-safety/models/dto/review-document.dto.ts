// Feature F06: Food safety documents & licence verification
import { IsNotEmpty, IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewDocumentDto {
  @IsNotEmpty({ message: 'Review action is required' })
  @IsIn(['approve', 'reject'], {
    message: 'Review action must be either approve or reject',
  })
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
