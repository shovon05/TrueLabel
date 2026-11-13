import { IsIn, IsString, MinLength, MaxLength } from 'class-validator';

// F13: A report describes a problem; it does not establish a safety violation.
export class CreateReportDto {
  @IsIn(['quality', 'expired', 'label', 'allergen', 'other'])
  category: 'quality' | 'expired' | 'label' | 'allergen' | 'other';

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  description: string;
}

export class UpdateReportStatusDto {
  @IsIn(['investigating', 'resolved', 'dismissed'])
  status: 'investigating' | 'resolved' | 'dismissed';
}
