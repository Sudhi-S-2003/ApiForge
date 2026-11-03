import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface StoredFileMetadata {
  token: string;
  absolutePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageRoot: string;
  private readonly exportsDir: string;
  private readonly uploadsDir: string;

  // In-memory token vault for fast lookup with automated expiration
  private readonly tokenMap = new Map<string, StoredFileMetadata>();

  constructor() {
    this.storageRoot = path.resolve(process.env.STORAGE_VAULT_PATH || path.join(process.cwd(), 'storage'));
    this.exportsDir = path.join(this.storageRoot, 'exports');
    this.uploadsDir = path.join(this.storageRoot, 'uploads');
  }

  onModuleInit() {
    this.ensureDirectoriesExist();
    this.logger.log(`Storage Vault initialized at: ${this.storageRoot}`);
  }

  private ensureDirectoriesExist() {
    if (!fs.existsSync(this.storageRoot)) {
      fs.mkdirSync(this.storageRoot, { recursive: true });
    }
    if (!fs.existsSync(this.exportsDir)) {
      fs.mkdirSync(this.exportsDir, { recursive: true });
    }
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Prevents Directory Traversal attacks (e.g. ../../etc/passwd)
   */
  public sanitizeAndValidatePath(targetPath: string): string {
    const resolved = path.resolve(targetPath);
    if (!resolved.startsWith(this.storageRoot)) {
      throw new BadRequestException('Security Violation: Path traversal detected outside storage vault root.');
    }
    return resolved;
  }

  /**
   * Persists an exported artifact (PDF, ZIP, JSON, YAML) into ./storage/exports/
   * and issues an opaque, short-lived download token.
   */
  async saveExportArtifact(
    filename: string,
    data: Buffer | string,
    mimeType: string,
    ttlHours = 24,
  ): Promise<{ token: string; downloadUrl: string; sizeBytes: number }> {
    this.ensureDirectoriesExist();

    const fileId = crypto.randomUUID();
    const extension = path.extname(filename) || '.bin';
    const diskFilename = `${fileId}${extension}`;
    const destinationPath = this.sanitizeAndValidatePath(path.join(this.exportsDir, diskFilename));

    if (Buffer.isBuffer(data)) {
      await fs.promises.writeFile(destinationPath, data);
    } else {
      await fs.promises.writeFile(destinationPath, data, 'utf-8');
    }

    const stat = await fs.promises.stat(destinationPath);
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

    const metadata: StoredFileMetadata = {
      token,
      absolutePath: destinationPath,
      originalFilename: filename,
      mimeType,
      sizeBytes: stat.size,
      createdAt: now,
      expiresAt,
    };

    this.tokenMap.set(token, metadata);

    return {
      token,
      downloadUrl: `/api/v1/storage/download/${token}`,
      sizeBytes: stat.size,
    };
  }

  /**
   * Resolves a download token and returns a readable stream and file metadata.
   */
  async getFileStreamByToken(token: string): Promise<{ stream: fs.ReadStream; metadata: StoredFileMetadata }> {
    const metadata = this.tokenMap.get(token);
    if (!metadata) {
      throw new NotFoundException('Download link is invalid or has expired.');
    }

    if (new Date() > metadata.expiresAt) {
      this.tokenMap.delete(token);
      // Attempt to unlink expired file asynchronously
      fs.promises.unlink(metadata.absolutePath).catch(() => {});
      throw new NotFoundException('Download link has expired.');
    }

    const safePath = this.sanitizeAndValidatePath(metadata.absolutePath);
    if (!fs.existsSync(safePath)) {
      throw new NotFoundException('Artifact file not found on disk.');
    }

    const stream = fs.createReadStream(safePath);
    return { stream, metadata };
  }

  /**
   * Scheduled or manual sweep for expired artifacts (>24h)
   */
  async cleanupExpiredArtifacts(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [token, meta] of this.tokenMap.entries()) {
      if (now > meta.expiresAt) {
        this.tokenMap.delete(token);
        try {
          if (fs.existsSync(meta.absolutePath)) {
            await fs.promises.unlink(meta.absolutePath);
            cleanedCount++;
          }
        } catch (err: any) {
          this.logger.error(`Failed to clean up file ${meta.absolutePath}: ${err.message}`);
        }
      }
    }

    return cleanedCount;
  }
}
