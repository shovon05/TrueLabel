// Feature F06: Food safety documents & licence verification
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FoodSafetyDocument,
  DocumentStatus,
  DocumentType,
} from '../models/food-safety-document.entity';
import {
  ManufacturerLicence,
  LicenceStatus,
} from '../models/manufacturer-licence.entity';
import { UploadDocumentDto } from '../models/dto/upload-document.dto';
import { ReviewDocumentDto } from '../models/dto/review-document.dto';

export interface DocumentWithMeta extends FoodSafetyDocument {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  formattedType: string;
}

export interface LicenceVerificationResult {
  isFound: boolean;
  isValid: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  licence: ManufacturerLicence | null;
  message: string;
  authority?: string;
  daysRemaining?: number;
}

export interface DocumentStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expiringSoon: number;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  trade_licence: 'Trade & Commercial Licence',
  halal: 'Halal Certification',
  iso22000: 'ISO 22000 Food Safety Management',
  lab_test: 'Independent Laboratory Analysis',
  gmp: 'Good Manufacturing Practice (GMP)',
  haccp: 'HACCP Food Hazard Control',
  organic: 'Certified Organic Standard',
};

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(FoodSafetyDocument)
    private readonly documentRepo: Repository<FoodSafetyDocument>,
    @InjectRepository(ManufacturerLicence)
    private readonly licenceRepo: Repository<ManufacturerLicence>,
  ) {}

  /**
   * Submit / Upload a new food safety document (Feature F06)
   */
  async uploadDocument(
    dto: UploadDocumentDto,
    user: { id: number; name?: string; role: string },
  ): Promise<FoodSafetyDocument> {
    const issue = new Date(dto.issueDate);
    const expiry = new Date(dto.expiryDate);

    if (isNaN(issue.getTime()) || isNaN(expiry.getTime())) {
      throw new BadRequestException('Invalid issue date or expiry date format');
    }

    if (expiry < issue) {
      throw new BadRequestException('Expiry date must be on or after the issue date');
    }

    const document = this.documentRepo.create({
      manufacturerId: user.id,
      companyName: dto.companyName.trim(),
      documentType: dto.documentType,
      certificateNumber: dto.certificateNumber.trim(),
      issuer: dto.issuer.trim(),
      issueDate: dto.issueDate,
      expiryDate: dto.expiryDate,
      fileUrl: dto.fileUrl ? dto.fileUrl.trim() : null,
      status: 'pending',
      notes: dto.notes ? dto.notes.trim() : null,
    });

    return await this.documentRepo.save(document);
  }

  /**
   * Inspector / Admin review state machine transition (Feature F06)
   * Transitions: pending -> approved, or pending -> rejected (with mandatory reason)
   */
  async reviewDocument(
    id: number,
    dto: ReviewDocumentDto,
    reviewer: { id: number; name: string; role: string },
  ): Promise<FoodSafetyDocument> {
    if (reviewer.role !== 'inspector' && reviewer.role !== 'admin') {
      throw new ForbiddenException(
        'Only certified inspectors and administrators can review food safety documents',
      );
    }

    const document = await this.documentRepo.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Food safety document with ID ${id} was not found`);
    }

    if (dto.action === 'reject') {
      if (!dto.rejectionReason || !dto.rejectionReason.trim()) {
        throw new BadRequestException(
          'A clear rejection reason is mandatory when rejecting a food safety document',
        );
      }
      document.status = 'rejected';
      document.rejectionReason = dto.rejectionReason.trim();
    } else if (dto.action === 'approve') {
      document.status = 'approved';
      document.rejectionReason = null;
    }

    document.reviewedById = reviewer.id;
    document.reviewedByName = reviewer.name || 'Official Food Safety Inspector';
    document.reviewDate = new Date();

    if (dto.notes) {
      document.notes = dto.notes.trim();
    }

    return await this.documentRepo.save(document);
  }

  /**
   * Query all documents with optional filters and computed expiry metadata
   */
  async getDocuments(filter?: {
    status?: DocumentStatus;
    documentType?: DocumentType;
    manufacturerId?: number;
  }): Promise<DocumentWithMeta[]> {
    const queryBuilder = this.documentRepo.createQueryBuilder('doc');

    if (filter?.status) {
      queryBuilder.andWhere('doc.status = :status', { status: filter.status });
    }

    if (filter?.documentType) {
      queryBuilder.andWhere('doc.documentType = :docType', {
        docType: filter.documentType,
      });
    }

    if (filter?.manufacturerId) {
      queryBuilder.andWhere('doc.manufacturerId = :mId', {
        mId: filter.manufacturerId,
      });
    }

    queryBuilder.orderBy('doc.createdAt', 'DESC');
    const documents = await queryBuilder.getMany();

    return documents.map((doc) => this.annotateWithMeta(doc));
  }

  /**
   * Get single document by ID with annotated metadata
   */
  async getDocumentById(id: number): Promise<DocumentWithMeta> {
    const document = await this.documentRepo.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Food safety document with ID ${id} was not found`);
    }
    return this.annotateWithMeta(document);
  }

  /**
   * Verify manufacturer licence against official demo registry (Feature F06)
   */
  async verifyLicence(licenceNumber: string): Promise<LicenceVerificationResult> {
    if (!licenceNumber || !licenceNumber.trim()) {
      return {
        isFound: false,
        isValid: false,
        isExpired: false,
        isSuspended: false,
        licence: null,
        message: 'Please provide a valid manufacturer licence number to verify.',
      };
    }

    const cleanNumber = licenceNumber.trim().toUpperCase();
    const licence = await this.licenceRepo.findOne({
      where: { licenceNumber: cleanNumber },
    });

    if (!licence) {
      return {
        isFound: false,
        isValid: false,
        isExpired: false,
        isSuspended: false,
        licence: null,
        message: `Licence '${cleanNumber}' was not found in the official food safety accreditation registry.`,
      };
    }

    const now = new Date();
    const expiryDate = new Date(licence.expiryDate);
    const isExpired = expiryDate < now || licence.status === 'expired';
    const isSuspended = licence.status === 'suspended' || licence.status === 'revoked';
    const isValid = licence.status === 'valid' && !isExpired && !isSuspended;

    const diffMs = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let message = '';
    if (isSuspended) {
      message = `WARNING: Licence '${licence.licenceNumber}' has been SUSPENDED by ${licence.authority}.`;
    } else if (isExpired) {
      message = `CAUTION: Licence '${licence.licenceNumber}' expired on ${licence.expiryDate}.`;
    } else {
      message = `VERIFIED: Licence '${licence.licenceNumber}' is ACTIVE and in good standing with ${licence.authority}.`;
    }

    return {
      isFound: true,
      isValid,
      isExpired,
      isSuspended,
      licence,
      message,
      authority: licence.authority,
      daysRemaining,
    };
  }

  /**
   * Aggregate statistics for dashboard summary
   */
  async getStatistics(): Promise<DocumentStatistics> {
    const all = await this.documentRepo.find();
    const now = new Date();

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let expiringSoon = 0;

    for (const doc of all) {
      if (doc.status === 'pending') pending++;
      if (doc.status === 'approved') approved++;
      if (doc.status === 'rejected') rejected++;

      const exp = new Date(doc.expiryDate);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        expiringSoon++;
      }
    }

    return {
      total: all.length,
      pending,
      approved,
      rejected,
      expiringSoon,
    };
  }

  /**
   * Helper to compute expiry metadata and display format
   */
  private annotateWithMeta(doc: FoodSafetyDocument): DocumentWithMeta {
    const now = new Date();
    const expiry = new Date(doc.expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isExpired = daysUntilExpiry < 0;
    const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

    return {
      ...doc,
      isExpired,
      isExpiringSoon,
      daysUntilExpiry,
      formattedType: DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType,
    };
  }
}
