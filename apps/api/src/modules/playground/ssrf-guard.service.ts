import { Injectable, BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import * as http from 'http';
import * as https from 'https';
import * as net from 'net';

@Injectable()
export class SsrfGuardService {
  /**
   * Blocked IPv4 and IPv6 CIDR / patterns
   */
  private isPrivateOrBlockedIp(ip: string): boolean {
    // IPv6 Loopback & Unspecified
    if (ip === '::1' || ip === '::') return true;

    // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
    if (ip.startsWith('::ffff:')) {
      const ipv4Part = ip.replace('::ffff:', '');
      return this.isPrivateOrBlockedIp(ipv4Part);
    }

    // IPv6 Link-Local & Unique Local
    if (ip.toLowerCase().startsWith('fe80:') || ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) {
      return true;
    }

    if (net.isIPv4(ip)) {
      const parts = ip.split('.').map(Number);
      const [a, b] = parts;

      // 127.0.0.0/8 (Loopback)
      if (a === 127) return true;

      // 0.0.0.0/8 (Broadcast/Current network)
      if (a === 0) return true;

      // 10.0.0.0/8 (Private RFC 1918)
      if (a === 10) return true;

      // 172.16.0.0/12 (Private RFC 1918)
      if (a === 172 && b >= 16 && b <= 31) return true;

      // 192.168.0.0/16 (Private RFC 1918)
      if (a === 192 && b === 168) return true;

      // 169.254.0.0/16 (Link-Local & Cloud Metadata e.g. 169.254.169.254)
      if (a === 169 && b === 254) return true;

      // 100.64.0.0/10 (Carrier-Grade NAT)
      if (a === 100 && b >= 64 && b <= 127) return true;

      // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
      if (a >= 224) return true;
    }

    return false;
  }

  /**
   * Pre-resolves DNS and validates all returned IP addresses.
   * Returns pinned IP address to prevent DNS rebinding attacks.
   */
  async resolveAndValidateDestination(hostname: string): Promise<string> {
    // If hostname is already an IP, check directly
    if (net.isIP(hostname)) {
      if (this.isPrivateOrBlockedIp(hostname)) {
        throw new BadRequestException(
          `SSRF Security Violation: Access to private or restricted IP address '${hostname}' is blocked.`,
        );
      }
      return hostname;
    }

    // Asynchronously resolve all IPv4 & IPv6 records
    let records: dns.LookupAddress[];
    try {
      records = await dns.promises.lookup(hostname, { all: true });
    } catch {
      throw new BadRequestException(`Failed to resolve DNS hostname: '${hostname}'`);
    }

    if (!records || records.length === 0) {
      throw new BadRequestException(`DNS resolution returned zero records for '${hostname}'`);
    }

    // Every resolved IP must be safe
    for (const record of records) {
      if (this.isPrivateOrBlockedIp(record.address)) {
        throw new BadRequestException(
          `SSRF Security Violation: Hostname '${hostname}' resolved to prohibited IP '${record.address}'.`,
        );
      }
    }

    // Pin the first validated IP address for socket connection
    return records[0].address;
  }

  /**
   * Creates custom HTTP / HTTPS agent with socket IP pinning to prevent DNS rebinding.
   */
  createPinnedAgent(pinnedIp: string, isHttps: boolean): http.Agent | https.Agent {
    const lookupCallback = (
      _hostname: string,
      optionsOrCallback: any,
      maybeCallback?: any,
    ) => {
      const isOptions = typeof optionsOrCallback === 'object' && optionsOrCallback !== null;
      const cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
      const family = net.isIPv6(pinnedIp) ? 6 : 4;
      if (typeof cb === 'function') {
        if (isOptions && optionsOrCallback.all) {
          cb(null, [{ address: pinnedIp, family }]);
        } else {
          cb(null, pinnedIp, family);
        }
      }
    };

    if (isHttps) {
      return new https.Agent({
        lookup: lookupCallback as any,
        timeout: 10000,
        keepAlive: false,
      });
    }

    return new http.Agent({
      lookup: lookupCallback as any,
      timeout: 10000,
      keepAlive: false,
    });
  }
}
