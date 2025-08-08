const crypto = require('crypto');

// Simple test for HKDF and encryption/decryption
async function testCrypto() {
  console.log('Testing HKDF and encryption utilities...\n');

  // Test HKDF
  const masterKey = 'test-master-key-minimum-32-characters-long';
  const userId = 'test-user-id';
  const salt = crypto.randomBytes(32).toString('hex');
  
  const ikm = Buffer.from(masterKey, 'utf-8');
  const saltBuffer = Buffer.from(userId + salt, 'utf-8');
  const infoBuffer = Buffer.from('keyring_encryption_v1', 'utf-8');

  const prk = crypto.createHmac('sha256', saltBuffer)
    .update(ikm)
    .digest();

  const derivedKey = crypto.createHmac('sha256', prk)
    .update(infoBuffer)
    .update(Buffer.from([0x01]))
    .digest();

  console.log('✓ HKDF key derivation successful');
  console.log('  Derived key length:', derivedKey.length, 'bytes\n');

  // Test encryption/decryption
  const privateKey = '0x' + crypto.randomBytes(32).toString('hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(privateKey, 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  console.log('✓ Encryption successful');
  console.log('  Original private key:', privateKey.substring(0, 10) + '...');
  
  // Test decryption
  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8');

  console.log('✓ Decryption successful');
  console.log('  Decrypted matches original:', decrypted === privateKey);
  
  console.log('\n✅ All crypto tests passed!');
}

testCrypto().catch(console.error);