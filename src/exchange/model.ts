import type { BrandFit, PhysicalMeasurement, SharingScope, StandardSize } from '../domain/model.js';

// The plaintext contents of a shared fit card, before encryption and after decryption.
export interface FitCardPayload {
  senderProfileId: string;
  senderDisplayName: string;
  exportedAt: string;
  scope: SharingScope;
  measurements: PhysicalMeasurement[];
  standardSizes: StandardSize[];
  brandFits: BrandFit[];
}

// The file format actually written to disk: FitCardPayload encrypted under a passphrase.
// salt/iv/ciphertext are base64. None of them are secret on their own — only the passphrase is.
export interface EncryptedFitCardFile {
  format: 'sigma-fit-card';
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
}

export function isEncryptedFitCardFile(value: unknown): value is EncryptedFitCardFile {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.format === 'sigma-fit-card' && record.version === 1 && typeof record.salt === 'string' && typeof record.iv === 'string' && typeof record.ciphertext === 'string';
}
