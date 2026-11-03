/**
 * Remember-Me Multi-Account Storage & Username Masking Utilities
 * Uses client-side localStorage to securely store and offer remembered account credentials.
 */

export interface RememberedAccount {
  id: string;
  name: string;
  email: string;
  username: string;
  maskedUsername: string;
  rememberToken: string;
  expiresAt: number; // Epoch milliseconds
  lastLoginAt: number; // Epoch milliseconds
}

const STORAGE_KEY = 'apiforge_remembered_accounts';

/**
 * Privacy-preserving username masking rule:
 * - If length > 5: Show first 2 chars + '***' + last 2 chars (e.g. jo***hn)
 * - If length <= 5: Show first char + '**' + last char (e.g. j**n)
 */
export function maskUsername(rawIdentifier: string): string {
  if (!rawIdentifier) return '';

  const clean = rawIdentifier.trim();
  const hasAt = clean.includes('@');
  const userPart = hasAt ? clean.split('@')[0] : clean;
  const domainPart = hasAt ? clean.split('@')[1] : '';

  let maskedUser = '';
  if (userPart.length > 5) {
    maskedUser = `${userPart.slice(0, 2)}***${userPart.slice(-2)}`;
  } else if (userPart.length > 1) {
    maskedUser = `${userPart.slice(0, 1)}**${userPart.slice(-1)}`;
  } else {
    maskedUser = `${userPart}*`;
  }

  return domainPart ? `${maskedUser}@${domainPart}` : maskedUser;
}

/**
 * Retrieve all remembered accounts, pruning expired entries automatically.
 */
export function getRememberedAccounts(): RememberedAccount[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: RememberedAccount[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    const valid = parsed.filter((acc) => acc.expiresAt && acc.expiresAt > now);

    // If any expired accounts were filtered, prune storage
    if (valid.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }

    return valid.sort((a, b) => b.lastLoginAt - a.lastLoginAt);
  } catch {
    return [];
  }
}

/**
 * Save or update a remembered account in localStorage.
 */
export function saveRememberedAccount(entry: {
  id: string;
  name: string;
  email: string;
  username?: string;
  rememberToken: string;
  expiresAt: number;
}): void {
  if (typeof window === 'undefined') return;

  try {
    const accounts = getRememberedAccounts();
    const identifier = entry.username || entry.email;
    const masked = maskUsername(identifier);

    const updatedAccount: RememberedAccount = {
      id: entry.id,
      name: entry.name,
      email: entry.email,
      username: identifier,
      maskedUsername: masked,
      rememberToken: entry.rememberToken,
      expiresAt: entry.expiresAt,
      lastLoginAt: Date.now(),
    };

    // Filter out existing account with same email or ID
    const remaining = accounts.filter(
      (acc) => acc.id !== entry.id && acc.email.toLowerCase() !== entry.email.toLowerCase(),
    );

    const updatedList = [updatedAccount, ...remaining];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to save remembered account:', err);
  }
}

/**
 * Remove a specific remembered account by ID or email.
 */
export function removeRememberedAccount(idOrEmail: string): void {
  if (typeof window === 'undefined') return;

  try {
    const accounts = getRememberedAccounts();
    const filtered = accounts.filter(
      (acc) => acc.id !== idOrEmail && acc.email.toLowerCase() !== idOrEmail.toLowerCase(),
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to remove remembered account:', err);
  }
}
