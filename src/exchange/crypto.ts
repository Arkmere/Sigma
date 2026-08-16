import type { EncryptedFitCardFile } from './model.js';

// Web Crypto is a browser/Node-20+ built-in (globalThis.crypto.subtle) — no new dependency,
// and it behaves identically in the Node test environment, so this is tested directly rather than mocked.
const PBKDF2_ITERATIONS = 250_000;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
}

async function deriveKey(passphrase: string, salt: BufferSource): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptFitCard(plaintext: string, passphrase: string): Promise<EncryptedFitCardFile> {
  if (!passphrase.trim()) throw new Error('A passphrase is required.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return { format: 'sigma-fit-card', version: 1, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

export async function decryptFitCard(file: EncryptedFitCardFile, passphrase: string): Promise<string> {
  const key = await deriveKey(passphrase, fromBase64(file.salt));
  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(file.iv) }, key, fromBase64(file.ciphertext));
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error('Incorrect passphrase, or the file is damaged.');
  }
}
