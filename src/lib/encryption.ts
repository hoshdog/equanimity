import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 64; // 512 bits
const TAG_LENGTH = 16; // 128 bits
const IV_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Get or generate encryption key from environment
 * In production, this should come from a secure key management service
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    // Use a default key for development only
    console.warn('Using default encryption key for development. Never use this in production!');
    return 'development_encryption_key_32_chars_minimum';
  }
  return key;
}

/**
 * Derives a key from the master key and salt using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param plaintext The data to encrypt
 * @returns Base64 encoded encrypted data with salt, iv, tag, and ciphertext
 */
export function encryptField(plaintext: string | undefined | null): string | null {
  if (!plaintext) {
    return null;
  }

  try {
    const masterKey = getEncryptionKey();
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from master key and salt
    const key = deriveKey(masterKey, salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the plaintext
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    
    // Return base64 encoded
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypts data encrypted with encryptField
 * @param encryptedData Base64 encoded encrypted data
 * @returns Decrypted plaintext
 */
export function decryptField(encryptedData: string | undefined | null): string | null {
  if (!encryptedData) {
    return null;
  }

  try {
    const masterKey = getEncryptionKey();
    
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from master key and salt
    const key = deriveKey(masterKey, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Hashes sensitive data for searching/indexing without storing plaintext
 * Uses HMAC for consistent hashing with a secret
 */
export function hashField(plaintext: string | undefined | null): string | null {
  if (!plaintext) {
    return null;
  }

  try {
    const secret = getEncryptionKey();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(plaintext);
    return hmac.digest('hex');
  } catch (error) {
    console.error('Hashing failed:', error);
    throw new Error('Failed to hash sensitive data');
  }
}

/**
 * Encrypts an object with specified sensitive fields
 * @param obj The object to encrypt
 * @param fieldsToEncrypt Array of field names to encrypt
 * @returns Object with specified fields encrypted
 */
export function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...obj };
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[field] = encryptField(String(encrypted[field])) as any;
    }
  }
  
  return encrypted;
}

/**
 * Decrypts an object with specified encrypted fields
 * @param obj The object to decrypt
 * @param fieldsToDecrypt Array of field names to decrypt
 * @returns Object with specified fields decrypted
 */
export function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...obj };
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      decrypted[field] = decryptField(String(decrypted[field])) as any;
    }
  }
  
  return decrypted;
}

// List of sensitive fields that should always be encrypted
export const SENSITIVE_FIELDS = {
  employee: ['tfn', 'bankAccountNumber', 'bankBsb', 'superMemberNumber'],
  payroll: ['grossPay', 'netPay', 'taxWithheld', 'superannuation'],
  contact: ['abn', 'taxNumber'],
} as const;

/**
 * Utility to check if a field should be encrypted
 */
export function isSensitiveField(collection: string, field: string): boolean {
  const fields = SENSITIVE_FIELDS[collection as keyof typeof SENSITIVE_FIELDS];
  return fields ? fields.includes(field as any) : false;
}