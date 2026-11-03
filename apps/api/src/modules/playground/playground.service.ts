import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SsrfGuardService } from './ssrf-guard.service';
import { ExecuteRequestDto } from './dto/execute-request.dto';
import { URL } from 'url';
import * as http from 'http';
import * as https from 'https';

export interface ExecutionResult {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  durationMs: number;
  responseSizeBytes: number;
}

@Injectable()
export class PlaygroundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ssrfGuard: SsrfGuardService,
  ) {}

  /**
   * Replaces variable tokens like {{baseUrl}} or {{token}} in string inputs.
   */
  private interpolateVariables(
    input: string,
    variables: Array<{ key: string; value: string }> = [],
  ): string {
    let result = input;
    for (const v of variables) {
      const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, 'g');
      result = result.replace(regex, v.value);
    }
    return result;
  }

  /**
   * Executes user-defined outbound HTTP request with strict SSRF defense.
   */
  async execute(userId: string, dto: ExecuteRequestDto): Promise<ExecutionResult> {
    const variables = dto.variables || [];

    // 1. Variable Interpolation
    let targetUrlStr = this.interpolateVariables(dto.url, variables);

    // Append query params if present
    if (dto.queryParams && Object.keys(dto.queryParams).length > 0) {
      const parsedUrl = new URL(targetUrlStr);
      for (const [k, v] of Object.entries(dto.queryParams)) {
        parsedUrl.searchParams.append(k, this.interpolateVariables(v, variables));
      }
      targetUrlStr = parsedUrl.toString();
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrlStr);
    } catch {
      throw new BadRequestException(`Malformed destination URL: '${targetUrlStr}'`);
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new BadRequestException(`Unsupported protocol '${parsedUrl.protocol}'. Only http: and https: are allowed.`);
    }

    // 2. SSRF Guard: Validate destination IP & Pin for DNS Rebinding Defense
    const pinnedIp = await this.ssrfGuard.resolveAndValidateDestination(parsedUrl.hostname);
    const isHttps = parsedUrl.protocol === 'https:';
    const agent = this.ssrfGuard.createPinnedAgent(pinnedIp, isHttps);

    // 3. Prepare Headers
    const reqHeaders: Record<string, string> = {
      'User-Agent': 'ApiForge-Playground/1.0',
      Accept: '*/*',
    };

    if (dto.headers) {
      for (const [k, v] of Object.entries(dto.headers)) {
        reqHeaders[k] = this.interpolateVariables(v, variables);
      }
    }

    // Prepare Request Body
    let bodyBuffer: Buffer | null = null;
    if (dto.body) {
      if (typeof dto.body === 'object') {
        const bodyStr = JSON.stringify(dto.body);
        const interpolated = this.interpolateVariables(bodyStr, variables);
        bodyBuffer = Buffer.from(interpolated, 'utf-8');
        if (!reqHeaders['content-type'] && !reqHeaders['Content-Type']) {
          reqHeaders['Content-Type'] = 'application/json';
        }
      } else {
        const interpolated = this.interpolateVariables(String(dto.body), variables);
        bodyBuffer = Buffer.from(interpolated, 'utf-8');
      }
      reqHeaders['Content-Length'] = String(bodyBuffer.length);
    }

    // 4. Execute Outbound Request
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const client = isHttps ? https : http;

      const reqOptions: http.RequestOptions = {
        method: dto.method,
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        headers: reqHeaders,
        agent,
        timeout: 10000, // 10s max
      };

      const req = client.request(reqOptions, (res) => {
        const chunks: Buffer[] = [];
        let totalSize = 0;
        const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

        res.on('data', (chunk: Buffer) => {
          totalSize += chunk.length;
          if (totalSize > MAX_SIZE) {
            req.destroy(new BadRequestException('Response payload exceeded 10MB limit'));
            return;
          }
          chunks.push(chunk);
        });

        res.on('end', async () => {
          const durationMs = Date.now() - startTime;
          const rawBuffer = Buffer.concat(chunks);
          const rawText = rawBuffer.toString('utf-8');

          let parsedBody: any = rawText;
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            try {
              parsedBody = JSON.parse(rawText);
            } catch {
              parsedBody = rawText;
            }
          }

          const responseHeaders: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (v) responseHeaders[k] = Array.isArray(v) ? v.join(', ') : v;
          }

          const result: ExecutionResult = {
            statusCode: res.statusCode || 200,
            statusText: res.statusMessage || 'OK',
            headers: responseHeaders,
            body: parsedBody,
            durationMs,
            responseSizeBytes: rawBuffer.length,
          };

          // Record in PlaygroundHistory
          try {
            await this.prisma.playgroundHistory.create({
              data: {
                userId,
                endpointId: dto.endpointId || null,
                method: dto.method,
                url: targetUrlStr,
                headers: reqHeaders,
                queryParams: dto.queryParams || {},
                body: dto.body || {},
                responseStatus: result.statusCode,
                durationMs: result.durationMs,
                responseSizeBytes: result.responseSizeBytes,
              },
            });
          } catch {
            // Ignore logging failure to ensure user gets response
          }

          resolve(result);
        });
      });

      req.on('timeout', () => {
        req.destroy(new BadRequestException('Request timed out after 10 seconds'));
      });

      req.on('error', (err) => {
        reject(new BadRequestException(`Request failed: ${err.message}`));
      });

      if (bodyBuffer) {
        req.write(bodyBuffer);
      }
      req.end();
    });
  }

  /**
   * List recent playground execution history for the user.
   */
  async getHistory(userId: string, limit = 20) {
    return this.prisma.playgroundHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        endpoint: {
          select: { summary: true, path: true, method: true },
        },
      },
    });
  }
}
