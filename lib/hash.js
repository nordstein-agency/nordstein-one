// lib/hash.js
import crypto from 'node:crypto';

export async function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
