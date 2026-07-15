import { emptySigmaData, type SigmaData } from '../domain/model.js';
import { migrateStoredData } from './migrations.js';

export type LoadResult =
  | { status: 'ok' | 'empty'; data: SigmaData }
  | { status: 'corrupt'; data: SigmaData; raw: string; reason: string }
  | { status: 'unsupported_version'; data: SigmaData; raw: unknown; version: unknown };

export interface DataRepository { load(): LoadResult; save(data: SigmaData): void; clear(): void; }
export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; }
export const DATA_STORAGE_KEY = 'sigma.data.v1';

export class LocalStorageRepository implements DataRepository {
  constructor(private readonly storage: KeyValueStorage, private readonly key = DATA_STORAGE_KEY) {}
  load(): LoadResult {
    const raw = this.storage.getItem(this.key);
    if (raw === null) return { status: 'empty', data: emptySigmaData() };
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch (error) { return { status: 'corrupt', data: emptySigmaData(), raw, reason: error instanceof Error ? error.message : 'Invalid JSON.' }; }
    const migrated = migrateStoredData(parsed);
    if (migrated.status === 'ok') return migrated;
    if (migrated.status === 'unsupported_version') return { ...migrated, data: emptySigmaData(), raw: parsed };
    return { ...migrated, data: emptySigmaData(), raw };
  }
  save(data: SigmaData): void { this.storage.setItem(this.key, JSON.stringify(data)); }
  clear(): void { this.storage.removeItem(this.key); }
}
