import { DATA_SCHEMA_VERSION, emptySigmaData, type SigmaData } from '../domain/model.js';

export interface DataRepository {
  load(): SigmaData;
  save(data: SigmaData): void;
  clear(): void;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DATA_STORAGE_KEY = 'sigma.data.v1';

export class LocalStorageRepository implements DataRepository {
  constructor(private readonly storage: KeyValueStorage, private readonly key = DATA_STORAGE_KEY) {}

  load(): SigmaData {
    const raw = this.storage.getItem(this.key);
    if (!raw) return emptySigmaData();
    try {
      const data = JSON.parse(raw) as SigmaData;
      if (data.schemaVersion !== DATA_SCHEMA_VERSION) return emptySigmaData();
      return structuredClone(data);
    } catch {
      return emptySigmaData();
    }
  }

  save(data: SigmaData): void {
    this.storage.setItem(this.key, JSON.stringify(data));
  }

  clear(): void {
    this.storage.removeItem(this.key);
  }
}
