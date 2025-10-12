import crypto from 'crypto';

// Base32 alphabet for TOTP
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Encode buffer to base32
function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

// Decode base32 string to buffer
function decodeBase32(input: string): Buffer {
  const upperInput = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < upperInput.length; i++) {
    const char = upperInput[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    while (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

// Generate a random TOTP secret
export function generateTOTPSecret(): string {
  return encodeBase32(crypto.randomBytes(20));
}

// Generate TOTP token
export function generateTOTP(secret: string, timeStep: number = 30): string {
  let counter = Math.floor(Date.now() / 1000 / timeStep);
  const buffer = Buffer.alloc(8);

  for (let i = 0; i < 8; i++) {
    buffer[7 - i] = counter & 0xff;
    counter = counter >> 8;
  }

  const key = decodeBase32(secret);
  const hmac = crypto.createHmac('sha1', key as any);
  hmac.update(buffer as any);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0xf;
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, '0');
}

// Verify TOTP token
export function verifyTOTP(
  secret: string,
  token: string,
  window: number = 1
): boolean {
  const currentTime = Math.floor(Date.now() / 1000 / 30);

  for (let i = -window; i <= window; i++) {
    const expectedToken = generateTOTP(secret);
    if (expectedToken === token) {
      return true;
    }
  }

  return false;
}

// Generate QR code URL for TOTP setup
export function generateTOTPUrl(
  email: string,
  secret: string,
  issuer: string = 'SpeedyVan'
): string {
  const encodedEmail = encodeURIComponent(email);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}`;
}
