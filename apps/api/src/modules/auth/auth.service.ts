import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { HashService } from './hash.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user and provision an initial default workspace.
   */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordHash = await this.hashService.hash(dto.password);

    // Create user and initial default personal workspace transactionally
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
        },
      });

      // Default personal workspace
      const workspaceSlug = `${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
      await tx.workspace.create({
        data: {
          name: `${dto.name}'s Workspace`,
          slug: workspaceSlug,
          description: 'Personal default workspace',
          members: {
            create: {
              userId: newUser.id,
              role: WorkspaceRole.OWNER,
            },
          },
        },
      });

      return newUser;
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  /**
   * Authenticate user with password and issue rotating tokens.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await this.hashService.verify(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, !!dto.rememberMe);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  /**
   * Authenticate user using persistent Remember-Me token (3-token architecture).
   */
  async loginWithRememberToken(dto: { rememberToken: string; userId?: string }) {
    if (!dto.rememberToken) {
      throw new UnauthorizedException('Remember token is required');
    }

    const rememberSecret =
      this.configService.get<string>('JWT_REMEMBER_SECRET') ||
      'apiforge_dev_remember_secret_key_minimum_32_characters_long';

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(dto.rememberToken, {
        secret: rememberSecret,
      });
    } catch {
      throw new UnauthorizedException('Remember-Me session has expired or is invalid');
    }

    if (payload.type !== 'remember_me' || !payload.sub) {
      throw new UnauthorizedException('Invalid remember token payload');
    }

    if (dto.userId && dto.userId !== payload.sub) {
      throw new UnauthorizedException('User mismatch for remember token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account not found or inactive');
    }

    // Generate fresh access + refresh tokens and rotate remember token
    const tokens = await this.generateTokens(user.id, user.email, true);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  /**
   * Rotate refresh token and issue new access token.
   */
  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        // Potential token reuse detected: revoke all user refresh tokens as defense
        await this.prisma.refreshToken.updateMany({
          where: { userId: storedToken.userId },
          data: { isRevoked: true },
        });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Mark previous token as revoked
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Issue fresh token pair
    return this.generateTokens(storedToken.user.id, storedToken.user.email);
  }

  /**
   * Revoke active refresh token on logout.
   */
  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  /**
   * Retrieve current user with active memberships.
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        memberships: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Helper: Generate access token, persistent hashed refresh token, and optional remember token.
   */
  private async generateTokens(userId: string, email: string, issueRememberMe = false) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_ACCESS_SECRET') ||
        'apiforge_dev_access_secret_key_minimum_32_characters_long',
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    let rememberToken: string | undefined;
    let rememberExpiresAt: number | undefined;

    if (issueRememberMe) {
      const rememberSecret =
        this.configService.get<string>('JWT_REMEMBER_SECRET') ||
        'apiforge_dev_remember_secret_key_minimum_32_characters_long';
      // 30 days
      rememberToken = this.jwtService.sign(
        { sub: userId, email, type: 'remember_me' },
        { secret: rememberSecret, expiresIn: '30d' },
      );
      rememberExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    }

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 mins in seconds
      rememberToken,
      rememberExpiresAt,
    };
  }
}
