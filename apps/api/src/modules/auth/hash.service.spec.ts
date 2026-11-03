import { HashService } from './hash.service';

describe('HashService (Argon2id)', () => {
  let hashService: HashService;

  beforeEach(() => {
    hashService = new HashService();
  });

  it('should hash a password with Argon2id and verify correctly', async () => {
    const rawPassword = 'SecretPassword123!';
    const hash = await hashService.hash(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');

    const isValid = await hashService.verify(hash, rawPassword);
    expect(isValid).toBe(true);
  }, 15000);

  it('should reject an incorrect password', async () => {
    const rawPassword = 'SecretPassword123!';
    const hash = await hashService.hash(rawPassword);

    const isValid = await hashService.verify(hash, 'WrongPassword456!');
    expect(isValid).toBe(false);
  }, 15000);
});
