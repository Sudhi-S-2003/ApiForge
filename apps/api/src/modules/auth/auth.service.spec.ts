import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { HashService } from './hash.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaMock: any;
  let hashMock: any;
  let jwtMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      workspace: {
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };

    hashMock = {
      hash: jest.fn().mockResolvedValue('$argon2id$mockedhash'),
      verify: jest.fn(),
    };

    jwtMock = {
      sign: jest.fn().mockReturnValue('mocked.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: HashService, useValue: hashMock },
        { provide: JwtService, useValue: jwtMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'secret';
              if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
              return null;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@test.com' });

      await expect(
        authService.register({
          email: 'existing@test.com',
          password: 'Password123!',
          name: 'Existing',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user, personal workspace, and issue tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'usr-1',
        email: 'new@test.com',
        name: 'New User',
      });
      prismaMock.workspace.create.mockResolvedValue({ id: 'ws-1', name: "New User's Workspace" });
      prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await authService.register({
        email: 'new@test.com',
        password: 'Password123!',
        name: 'New User',
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe('new@test.com');
      expect(result.accessToken).toBe('mocked.jwt.token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@test.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'usr-1',
        email: 'valid@test.com',
        passwordHash: '$argon2id$somehash',
        isActive: true,
      });
      hashMock.verify.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'valid@test.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'usr-1',
        email: 'valid@test.com',
        name: 'Valid User',
        passwordHash: '$argon2id$somehash',
        isActive: true,
      });
      hashMock.verify.mockResolvedValue(true);
      prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await authService.login({
        email: 'valid@test.com',
        password: 'CorrectPassword!',
      });

      expect(result.accessToken).toBe('mocked.jwt.token');
      expect(result.user.name).toBe('Valid User');
    });
  });
});
