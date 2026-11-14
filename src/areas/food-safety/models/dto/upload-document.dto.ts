// Feature F06: Food safety documents & licence verification
import { IsNotEmpty, IsString, IsIn, IsOptional, MaxLength } from 'class-validator';
import { DocumentType } from '../food-safety-document.entity';

export const VALID_DOCUMENT_TYPES: DocumentType[] = [
  'trade_licence',
  'halal',
  'iso22000',
  'lab_test',
  'gmp',
  'haccp',
  'organic',
];

export class UploadDocumentDto {
  @IsNotEmpty({ message: 'Company name is required' })
  @IsString()
  @MaxLength(150)
  companyName: string;

  @IsNotEmpty({ message: 'Document type is required' })
  @IsIn(VALID_DOCUMENT_TYPES, {
    message: 'Invalid document type. Allowed types: trade_licence, halal, iso22000, lab_test, gmp, haccp, organic',
  })
  documentType: DocumentType;

  @IsNotEmpty({ message: 'Certificate or licence number is required' })
  @IsString()
  @MaxLength(100)
  certificateNumber: string;

  @IsNotEmpty({ message: 'Issuing accreditation authority is required' })
  @IsString()
  @MaxLength(150)
  issuer: string;

  @IsNotEmpty({ message: 'Issue date is required' })
  @IsString()
  issueDate: string;

  @IsNotEmpty({ message: 'Expiry date is required' })
  @IsString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
