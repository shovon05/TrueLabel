// Feature F06: Food safety documents & licence verification
import { Test, TestingModule } from '@nestjs/testing';
import { SafetyDocumentController } from './safety-document.controller';
import { DocumentService } from '../services/document.service';
import { UploadDocumentDto } from '../models/dto/upload-document.dto';
import { ReviewDocumentDto } from '../models/dto/review-document.dto';

describe('SafetyDocumentController (Unit Tests)', () => {
  let controller: SafetyDocumentController;
  let documentService: jest.Mocked<Partial<DocumentService>>;

  const mockDocumentMeta = {
    id: 1,
    manufacturerId: 10,
    companyName: 'OatLand Organics Ltd.',
    documentType: 'halal' as const,
    certificateNumber: 'HALAL-BD-2024-99',
    issuer: 'Islamic Foundation Bangladesh',
    issueDate: '2024-01-01',
    expiryDate: '2027-12-31',
    fileUrl: null,
    status: 'pending' as const,
    rejectionReason: null,
    reviewedById: null,
    reviewedByName: null,
    reviewDate: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isExpired: false,
    isExpiringSoon: false,
    daysUntilExpiry: 365,
    formattedType: 'Halal Certification',
  };

  const mockStats = {
    total: 10,
    pending: 4,
    approved: 5,
    rejected: 1,
    expiringSoon: 2,
  };

  beforeEach(async () => {
    documentService = {
      getDocuments: jest.fn().mockResolvedValue([mockDocumentMeta]),
      getStatistics: jest.fn().mockResolvedValue(mockStats),
      uploadDocument: jest.fn().mockResolvedValue(mockDocumentMeta),
      reviewDocument: jest.fn().mockResolvedValue({
        ...mockDocumentMeta,
        status: 'approved',
      }),
      verifyLicence: jest.fn().mockResolvedValue({
        isFound: true,
        isValid: true,
        isExpired: false,
        isSuspended: false,
        licence: null,
        message: 'Licence is verified',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SafetyDocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: documentService,
        },
      ],
    }).compile();

    controller = module.get<SafetyDocumentController>(SafetyDocumentController);
  });

  describe('getDocuments', () => {
    it('should return documents, stats, and currentFilter (AAA Pattern)', async () => {
      // Arrange
      const req: any = { session: { user: { id: 1, role: 'inspector' } } };

      // Act
      const result = await controller.getDocuments(
        req,
        'pending',
        'halal',
        'false',
        'false',
      );

      // Assert
      expect(result).toHaveProperty('documents');
      expect(result).toHaveProperty('stats');
      expect(result.stats).toEqual(mockStats);
      expect(result.currentFilter).toEqual({ status: 'pending', type: 'halal' });
      expect(documentService.getDocuments).toHaveBeenCalledWith({
        status: 'pending',
        documentType: 'halal',
      });
    });
  });

  describe('getUploadPage', () => {
    it('should return upload page title and session user', () => {
      // Arrange
      const req: any = { session: { user: { id: 10, role: 'manufacturer' } } };

      // Act
      const result = controller.getUploadPage(req);

      // Assert
      expect(result.title).toContain('Submit Food Safety Document');
      expect(result.user).toEqual(req.session.user);
    });
  });

  describe('handleUpload', () => {
    const validDto: UploadDocumentDto = {
      companyName: 'OatLand Organics Ltd.',
      documentType: 'halal',
      certificateNumber: 'HALAL-123',
      issuer: 'Islamic Foundation',
      issueDate: '2024-01-01',
      expiryDate: '2026-01-01',
    };

    it('should redirect to /safety/documents?uploaded=true on success', async () => {
      // Arrange
      const req: any = { session: { user: { id: 10, role: 'manufacturer' } } };
      const res: any = { redirect: jest.fn() };

      // Act
      await controller.handleUpload(validDto, req, res);

      // Assert
      expect(documentService.uploadDocument).toHaveBeenCalledWith(
        validDto,
        req.session.user,
      );
      expect(res.redirect).toHaveBeenCalledWith(
        '/safety/documents?uploaded=true',
      );
    });

    it('should re-render upload view if service throws error', async () => {
      // Arrange
      const req: any = { session: { user: { id: 10, role: 'manufacturer' } } };
      const res: any = { render: jest.fn() };
      documentService.uploadDocument = jest
        .fn()
        .mockRejectedValue(new Error('Invalid dates'));

      // Act
      await controller.handleUpload(validDto, req, res);

      // Assert
      expect(res.render).toHaveBeenCalledWith(
        'areas/food-safety/views/upload',
        expect.objectContaining({
          error: 'Invalid dates',
        }),
      );
    });
  });

  describe('handleReview', () => {
    const reviewDto: ReviewDocumentDto = {
      action: 'approve',
      notes: 'All checks passed',
    };

    it('should review document and redirect with reviewed=true', async () => {
      // Arrange
      const req: any = { session: { user: { id: 5, role: 'inspector' } } };
      const res: any = { redirect: jest.fn() };

      // Act
      await controller.handleReview(1, reviewDto, req, res);

      // Assert
      expect(documentService.reviewDocument).toHaveBeenCalledWith(
        1,
        reviewDto,
        req.session.user,
      );
      expect(res.redirect).toHaveBeenCalledWith(
        '/safety/documents?reviewed=true',
      );
    });

    it('should redirect with encoded error message on failure', async () => {
      // Arrange
      const req: any = { session: { user: { id: 5, role: 'inspector' } } };
      const res: any = { redirect: jest.fn() };
      documentService.reviewDocument = jest
        .fn()
        .mockRejectedValue(new Error('Mandatory rejection reason missing'));

      // Act
      await controller.handleReview(1, reviewDto, req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error=Mandatory'),
      );
    });
  });

  describe('getVerifyLicencePage', () => {
    it('should verify licence when licenceNumber query is provided', async () => {
      // Arrange
      const req: any = { session: { user: null } };

      // Act
      const result = await controller.getVerifyLicencePage(
        'BSTI-FOOD-2024-001',
        req,
      );

      // Assert
      expect(documentService.verifyLicence).toHaveBeenCalledWith(
        'BSTI-FOOD-2024-001',
      );
      expect(result.result).not.toBeNull();
      expect(result.licenceNumber).toBe('BSTI-FOOD-2024-001');
    });

    it('should return null result when licenceNumber is not provided', async () => {
      // Arrange
      const req: any = { session: { user: null } };

      // Act
      const result = await controller.getVerifyLicencePage('', req);

      // Assert
      expect(documentService.verifyLicence).not.toHaveBeenCalled();
      expect(result.result).toBeNull();
    });
  });
});
