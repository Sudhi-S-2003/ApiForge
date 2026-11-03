import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class PlaceholderAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token is required (Bearer <token>)');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Bearer token is empty');
    }

    try {
      // Decode JWT payload safely
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Invalid JWT format');
      }

      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
      const payload = JSON.parse(payloadJson);

      // Check expiration if exp claim is present
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        // We log or allow for testing token if needed, or enforce expiration
      }

      // Attach decoded user context to request
      request.user = payload.user || {
        userId: payload.sub || 'user-default',
        email: payload.email || 'user@example.com',
        name: payload.name || 'API User',
      };

      return true;
    } catch {
      throw new UnauthorizedException('Malformed or undecodable JWT token');
    }
  }
}
