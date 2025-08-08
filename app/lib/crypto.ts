import crypto from 'crypto';
import { promisify } from 'util';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

const hkdfAsync = promisify(crypto.hkdf);

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export function generateSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

export async function deriveKey(
  masterKey: string,
  userId: string,
  salt: string,
  info: string = 'keyring_encryption_v1'
): Promise<Buffer> {
  if (!masterKey) {
    throw new Error('Master key is not configured');
  }

  const ikm = Buffer.from(masterKey, 'utf-8');
  const saltBuffer = Buffer.from(userId + salt, 'utf-8');
  const infoBuffer = Buffer.from(info, 'utf-8');
  
  // Built-in HKDF - one line!
  const derivedKey = await hkdfAsync('sha256', ikm, saltBuffer, infoBuffer, 32);
  return Buffer.from(derivedKey);
}

export async function encryptPrivateKey(
  privateKey: string,
  encryptionKey: Buffer
): Promise<string> {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(privateKey, 'utf8'),
    cipher.final()
  ]);
  
  const tag = cipher.getAuthTag();
  
  const combined = Buffer.concat([iv, tag, encrypted]);
  
  return combined.toString('base64');
}

export async function decryptPrivateKey(
  encryptedData: string,
  encryptionKey: Buffer
): Promise<string> {
  const combined = Buffer.from(encryptedData, 'base64');
  
  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(tag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}

export function generateEOAPrivateKey(): string {
  return generatePrivateKey();
}

export function getAddressFromPrivateKey(privateKey: string): string {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return account.address;
}

export function clearSensitiveData(data: any): void {
  if (Buffer.isBuffer(data)) {
    data.fill(0);
  } else if (typeof data === 'string') {
    data = '';
  } else if (data && typeof data === 'object') {
    Object.keys(data).forEach(key => {
      data[key] = null;
    });
  }
}