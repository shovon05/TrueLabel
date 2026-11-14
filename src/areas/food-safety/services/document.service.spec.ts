// Feature F06: Food safety documents & licence verification
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DocumentService } from './document.service';
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

describe('DocumentService (Unit Tests)', () => {
  let service: DocumentService;
  let docRepo: jest.Mocked<Repository<FoodSafetyDocument>>;
  let licenceRepo: jest.Mocked<Repository<ManufacturerLicence>>;

  const mockDocument: FoodSafetyDocument = {
    id: 1,
    manufacturerId: 10,
    companyName: 'OatLand Organics Ltd.',
    documentType: 'halal' as DocumentType,
    certificateNumber: 'HALAL-BD-2024-99',
    issuer: 'Islamic Foundation Bangladesh',
    issueDate: '2024-01-01',
    expiryDate: '2027-12-31',
    fileUrl: 'https://storage.truelabel.demo/certs/halal-oatland.pdf',
    status: 'pending' as DocumentStatus,
    rejectionReason: null,
    reviewedById: null,
    reviewedByName: null,
    reviewDate: null,
    notes: 'Official export certificate',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  };

  const mockLicence: ManufacturerLicence = {
    id: 1,
    licenceNumber: 'BSTI-FOOD-2024-001',
    companyName: 'OatLand Organics Ltd.',
    authority: 'Bangladesh Standards and Testing Institution (BSTI)',
    category: 'Dairy & Plant Milks',
    issueDate: '2024-01-01',
    expiryDate: '2027-01-01',
    status: 'valid' as LicenceStatus,
    address: 'Tejgaon I/A, Dhaka, Bangladesh',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockDocRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockLicenceRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getRepositoryToken(FoodSafetyDocument),
          useValue: mockDocRepo,
        },
        {
          provide: getRepositoryToken(ManufacturerLicence),
          useValue: mockLicenceRepo,
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    docRepo = module.get(getRepositoryToken(FoodSafetyDocument));
    licenceRepo = module.get(getRepositoryToken(ManufacturerLicence));
  });

  describe('uploadDocument', () => {
    const validDto: UploadDocumentDto = {
      companyName: 'OatLand Organics Ltd.',
      documentType: 'iso22000',
      certificateNumber: 'ISO-22000-2024-01',
      issuer: 'SGS Certification',
      issueDate: '2024-01-01',
      expiryDate: '2026-01-01',
      fileUrl: 'https://storage.truelabel.demo/certs/iso.pdf',
      notes: 'Annual audit certificate',
    };

    it('should successfully create and save a document with pending status (AAA Pattern)', async () => {
      // Arrange
      const user = { id: 10, name: 'Oat Manufacturer', role: 'manufacturer' };
      docRepo.create.mockReturnValue(mockDocument);
      docRepo.save.mockResolvedValue(mockDocument);

      // Act
      const result = await service.uploadDocument(validDto, user);

      // Assert
      expect(result).toEqual(mockDocument);
      expect(docRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          manufacturerId: 10,
          companyName: 'OatLand Organics Ltd.',
          documentType: 'iso22000',
          certificateNumber: 'ISO-22000-2024-01',
          status: 'pending',
        }),
      );
      expect(docRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if expiryDate is before issueDate', async () => {
      // Arrange
      const invalidDto: UploadDocumentDto = {
        ...validDto,
        issueDate: '2025-01-01',
        expiryDate: '2024-01-01', // Before issue date!
      };
      const user = { id: 10, role: 'manufacturer' };

      // Act & Assert
      await expect(service.uploadDocument(invalidDto, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if dates are malformed', async () => {
      // Arrange
      const invalidDto: UploadDocumentDto = {
        ...validDto,
        issueDate: 'not-a-date',
      };
      const user = { id: 10, role: 'manufacturer' };

      // Act & Assert
      await expect(service.uploadDocument(invalidDto, user)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reviewDocument (State Machine)', () => {
    const inspector = { id: 5, name: 'Dr. John Inspector', role: 'inspector' };
    const admin = { id: 1, name: 'System Admin', role: 'admin' };
    const consumer = { id: 9, name: 'Regular Consumer', role: 'consumer' };

    it('should successfully transition document to approved status when approved by inspector', async () => {
      // Arrange
      const existingDoc = { ...mockDocument, status: 'pending' as DocumentStatus };
      docRepo.findOne.mockResolvedValue(existingDoc);
      docRepo.save.mockImplementation(async (d: any) => d);

      const reviewDto: ReviewDocumentDto = {
        action: 'approve',
        notes: 'Certificate verified against issuing body registry',
      };

      // Act
      const result = await service.reviewDocument(1, reviewDto, inspector);

      // Assert
      expect(result.status).toBe('approved');
      expect(result.rejectionReason).toBeNull();
      expect(result.reviewedById).toBe(5);
      expect(result.reviewedByName).toBe('Dr. John Inspector');
      expect(result.reviewDate).toBeInstanceOf(Date);
      expect(docRepo.save).toHaveBeenCalled();
    });

    it('should successfully transition document to rejected status when rejected with valid reason', async () => {
      // Arrange
      const existingDoc = { ...mockDocument, status: 'pending' as DocumentStatus };
      docRepo.findOne.mockResolvedValue(existingDoc);
      docRepo.save.mockImplementation(async (d: any) => d);

      const reviewDto: ReviewDocumentDto = {
        action: 'reject',
        rejectionReason: 'The provided laboratory testing report is missing heavy metal analysis',
      };

      // Act
      const result = await service.reviewDocument(1, reviewDto, admin);

      // Assert
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe(
        'The provided laboratory testing report is missing heavy metal analysis',
      );
      expect(result.reviewedById).toBe(1);
    });

    it('should throw BadRequestException if rejecting without a rejection reason', async () => {
      // Arrange
      docRepo.findOne.mockResolvedValue({ ...mockDocument });
      const invalidReviewDto: ReviewDocumentDto = {
        action: 'reject',
        rejectionReason: '', // Empty reason!
      };

      // Act & Assert
      await expect(
        service.reviewDocument(1, invalidReviewDto, inspector),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not an inspector or admin', async () => {
      // Arrange
      const reviewDto: ReviewDocumentDto = { action: 'approve' };

      // Act & Assert
      await expect(
        service.reviewDocument(1, reviewDto, consumer),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if document does not exist', async () => {
      // Arrange
      docRepo.findOne.mockResolvedValue(null);
      const reviewDto: ReviewDocumentDto = { action: 'approve' };

      // Act & Assert
      await expect(
        service.reviewDocument(999, reviewDto, inspector),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDocumentById & getDocuments', () => {
    it('should return document with computed expiry metadata', async () => {
      // Arrange
      docRepo.findOne.mockResolvedValue({ ...mockDocument });

      // Act
      const result = await service.getDocumentById(1);

      // Assert
      expect(result.id).toBe(1);
      expect(result).toHaveProperty('isExpired');
      expect(result).toHaveProperty('isExpiringSoon');
      expect(result).toHaveProperty('daysUntilExpiry');
      expect(result.formattedType).toBe('Halal Certification');
    });

    it('should throw NotFoundException if getDocumentById does not find document', async () => {
      // Arrange
      docRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getDocumentById(99)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should query documents with filters and return metadata', async () => {
      // Arrange
      const mockQb: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockDocument]),
      };
      docRepo.createQueryBuilder.mockReturnValue(mockQb);

      // Act
      const results = await service.getDocuments({
        status: 'pending',
        documentType: 'halal',
        manufacturerId: 10,
      });

      // Assert
      expect(results.length).toBe(1);
      expect(mockQb.andWhere).toHaveBeenCalledWith('doc.status = :status', {
        status: 'pending',
      });
      expect(mockQb.andWhere).toHaveBeenCalledWith('doc.documentType = :docType', {
        docType: 'halal',
      });
      expect(mockQb.andWhere).toHaveBeenCalledWith('doc.manufacturerId = :mId', {
        mId: 10,
      });
    });
  });

  describe('verifyLicence (Official Demo Registry)', () => {
    it('should return valid result for active valid licence in registry', async () => {
      // Arrange
      licenceRepo.findOne.mockResolvedValue(mockLicence);

      // Act
      const result = await service.verifyLicence('BSTI-FOOD-2024-001');

      // Assert
      expect(result.isFound).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
      expect(result.authority).toBe(
        'Bangladesh Standards and Testing Institution (BSTI)',
      );
      expect(result.message).toContain('ACTIVE and in good standing');
    });

    it('should detect expired licence', async () => {
      // Arrange
      const expiredLicence: ManufacturerLicence = {
        ...mockLicence,
        expiryDate: '2020-01-01',
        status: 'expired',
      };
      licenceRepo.findOne.mockResolvedValue(expiredLicence);

      // Act
      const result = await service.verifyLicence('BSTI-FOOD-2020-EXP');

      // Assert
      expect(result.isFound).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.message).toContain('expired');
    });

    it('should detect suspended licence', async () => {
      // Arrange
      const suspendedLicence: ManufacturerLicence = {
        ...mockLicence,
        status: 'suspended',
      };
      licenceRepo.findOne.mockResolvedValue(suspendedLicence);

      // Act
      const result = await service.verifyLicence('BFSA-SUSP-123');

      // Assert
      expect(result.isFound).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.isSuspended).toBe(true);
      expect(result.message).toContain('SUSPENDED');
    });

    it('should return not found for unknown licence', async () => {
      // Arrange
      licenceRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.verifyLicence('UNKNOWN-999');

      // Assert
      expect(result.isFound).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.licence).toBeNull();
      expect(result.message).toContain('not found');
    });

    it('should return error message when licenceNumber is empty', async () => {
      // Act
      const result = await service.verifyLicence('   ');

      // Assert
      expect(result.isFound).toBe(false);
      expect(result.isValid).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should aggregate counts correctly', async () => {
      // Arrange
      const docs: FoodSafetyDocument[] = [
        { ...mockDocument, id: 1, status: 'pending' },
        { ...mockDocument, id: 2, status: 'approved' },
        { ...mockDocument, id: 3, status: 'rejected' },
      ];
      docRepo.find.mockResolvedValue(docs);

      // Act
      const stats = await service.getStatistics();

      // Assert
      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(1);
      expect(stats.rejected).toBe(1);
    });
  });
});
