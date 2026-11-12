import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../models/user.entity';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should successfully register a new user with hashed password', async () => {
      // Arrange
      const dto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'securePassword123',
        role: 'consumer' as const,
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockImplementation((userData) => ({
        id: 1,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      (userRepository.save as jest.Mock).mockImplementation(async (u) => u);

      // Act
      const result = await service.register(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.email).toBe('jane@example.com');
      expect((result as any).passwordHash).toBeUndefined();
      expect(userRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email is already taken', async () => {
      // Arrange
      const dto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        role: 'consumer' as const,
      };

      (userRepository.findOne as jest.Mock).mockResolvedValue({
        id: 2,
        email: 'jane@example.com',
      } as User);

      // Act & Assert
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user without passwordHash when credentials are valid', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('secretPass', 10);
      const mockUser = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: hashedPassword,
        role: 'consumer' as const,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      (userRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser({
        email: 'jane@example.com',
        password: 'secretPass',
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('realPassword', 10);
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'jane@example.com',
        passwordHash: hashedPassword,
      } as User);

      // Act & Assert
      await expect(
        service.validateUser({
          email: 'jane@example.com',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user email does not exist', async () => {
      // Arrange
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.validateUser({
          email: 'nonexistent@example.com',
          password: 'anyPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      // Arrange
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Jane',
        email: 'jane@example.com',
        passwordHash: 'hash',
      } as User);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result.id).toBe(1);
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      // Arrange
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });
});
