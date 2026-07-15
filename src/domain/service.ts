import { currentMeasurementValue, DATA_SCHEMA_VERSION, type BrandFit, type MeasurementValue, type PhysicalMeasurement, type Profile, type SigmaBackup, type SigmaData, type StandardSize } from './model.js';
import type { DataRepository, LoadResult } from '../data/repository.js';
import { convertUnit, footwearConversions, measurementSemantics, resolveUnit, unitsForDimension, type ConversionResult, type FootwearContext } from '../conversion/registry.js';

type Clock = () => string;
type IdFactory = () => string;
const defaultId = () => globalThis.crypto?.randomUUID?.() ?? `sigma-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const defaultClock = () => new Date().toISOString();

export class SigmaService {
  private data: SigmaData;
  private loadResult: LoadResult;
  constructor(private readonly repository: DataRepository, private readonly now: Clock = defaultClock, private readonly id: IdFactory = defaultId) {
    this.loadResult = repository.load();
    this.data = this.loadResult.data;
  }

  storageStatus(): LoadResult { return structuredClone(this.loadResult); }
  snapshot(): SigmaData { return structuredClone(this.data); }
  activeProfile(): Profile | undefined { return this.data.profiles.find((profile) => profile.id === this.data.activeProfileId); }
  selectProfile(profileId: string): void { this.ensureWritable(); this.requireProfile(profileId); this.data.activeProfileId = profileId; this.persist(); }

  createProfile(input: Pick<Profile, 'displayName' | 'profileType'> & Partial<Pick<Profile, 'relationshipLabel' | 'dateOfBirth' | 'notes'>>): Profile {
    this.ensureWritable();
    const timestamp = this.now();
    const profile: Profile = { id: this.id(), displayName: input.displayName.trim(), profileType: input.profileType, relationshipLabel: clean(input.relationshipLabel), dateOfBirth: clean(input.dateOfBirth), notes: clean(input.notes), createdAt: timestamp, updatedAt: timestamp };
    if (!profile.displayName) throw new Error('Display name is required.');
    this.data.profiles.push(profile);
    this.data.activeProfileId ??= profile.id;
    this.persist(); return structuredClone(profile);
  }

  updateProfile(profileId: string, input: Partial<Pick<Profile, 'displayName' | 'profileType' | 'relationshipLabel' | 'dateOfBirth' | 'notes'>>): Profile {
    this.ensureWritable();
    const profile = this.requireProfile(profileId);
    Object.assign(profile, input, { updatedAt: this.now() });
    profile.displayName = profile.displayName.trim();
    if (!profile.displayName) throw new Error('Display name is required.');
    this.persist(); return structuredClone(profile);
  }

  addMeasurement(input: Omit<PhysicalMeasurement, 'id' | 'kind' | 'values' | 'visibility' | 'createdAt' | 'updatedAt'> & Omit<MeasurementValue, 'id' | 'createdAt'>): PhysicalMeasurement {
    this.ensureWritable();
    this.requireProfile(input.profileId); const timestamp = this.now();
    const value = this.makeValue(input, timestamp);
    const record: PhysicalMeasurement = { id: this.id(), profileId: input.profileId, kind: 'measurement', measurementType: input.measurementType, category: input.category, label: input.label, values: [value], visibility: 'private', createdAt: timestamp, updatedAt: timestamp };
    this.data.measurements.push(record); this.persist(); return structuredClone(record);
  }

  addMeasurementValue(recordId: string, input: Omit<MeasurementValue, 'id' | 'createdAt'>): PhysicalMeasurement {
    this.ensureWritable();
    const record = this.data.measurements.find((item) => item.id === recordId); if (!record) throw new Error('Measurement not found.');
    record.values.push(this.makeValue(input, this.now())); record.updatedAt = this.now(); this.persist(); return structuredClone(record);
  }

  updateMeasurement(recordId: string, input: Pick<PhysicalMeasurement, 'label' | 'category' | 'measurementType'>): PhysicalMeasurement {
    this.ensureWritable();
    const record = this.data.measurements.find((item) => item.id === recordId); if (!record) throw new Error('Measurement not found.');
    Object.assign(record, input, { updatedAt: this.now() }); this.persist(); return structuredClone(record);
  }

  addStandardSize(input: Omit<StandardSize, 'id' | 'kind' | 'visibility' | 'createdAt' | 'updatedAt'>): StandardSize {
    this.ensureWritable();
    this.requireProfile(input.profileId); const timestamp = this.now();
    const record: StandardSize = { ...input, id: this.id(), kind: 'standard_size', visibility: 'private', createdAt: timestamp, updatedAt: timestamp };
    this.data.standardSizes.push(record); this.persist(); return structuredClone(record);
  }

  updateStandardSize(recordId: string, input: Pick<StandardSize, 'category' | 'label' | 'sizingSystem' | 'sizeValue' | 'notes'>): StandardSize {
    this.ensureWritable();
    const record = this.data.standardSizes.find((item) => item.id === recordId); if (!record) throw new Error('Standard size not found.');
    Object.assign(record, input, { updatedAt: this.now() }); this.persist(); return structuredClone(record);
  }

  addBrandFit(input: Omit<BrandFit, 'id' | 'kind' | 'visibility' | 'createdAt' | 'updatedAt'>): BrandFit {
    this.ensureWritable();
    this.requireProfile(input.profileId); const timestamp = this.now();
    const record: BrandFit = { ...input, id: this.id(), kind: 'brand_fit', visibility: 'private', createdAt: timestamp, updatedAt: timestamp };
    this.data.brandFits.push(record); this.persist(); return structuredClone(record);
  }

  updateBrandFit(recordId: string, input: Pick<BrandFit, 'category' | 'brand' | 'productName' | 'productLine' | 'sizingSystem' | 'sizeValue' | 'fitNotes'>): BrandFit {
    this.ensureWritable();
    const record = this.data.brandFits.find((item) => item.id === recordId); if (!record) throw new Error('Brand fit not found.');
    Object.assign(record, input, { updatedAt: this.now() }); this.persist(); return structuredClone(record);
  }

  records(profileId: string, query = '', category = '') {
    const needle = query.trim().toLowerCase();
    const matches = (parts: Array<string | undefined>, itemCategory: string) => (!category || itemCategory === category) && (!needle || parts.some((part) => part?.toLowerCase().includes(needle)));
    return {
      measurements: this.data.measurements.filter((r) => r.profileId === profileId && matches([r.label, r.measurementType, r.category], r.category)),
      standardSizes: this.data.standardSizes.filter((r) => r.profileId === profileId && matches([r.label, r.category, r.sizingSystem, r.sizeValue], r.category)),
      brandFits: this.data.brandFits.filter((r) => r.profileId === profileId && matches([r.brand, r.productName, r.productLine, r.category, r.sizingSystem, r.sizeValue], r.category)),
    };
  }

  exportBackup(): SigmaBackup { return { product: 'Sigma', exportedAt: this.now(), ...this.snapshot(), schemaVersion: DATA_SCHEMA_VERSION }; }
  reset(): void { this.repository.clear(); this.loadResult = this.repository.load(); this.data = this.loadResult.data; }
  currentValue(record: PhysicalMeasurement) { return currentMeasurementValue(record); }
  measurementConversions(recordId: string): ConversionResult[] {
    const record = this.data.measurements.find((item) => item.id === recordId); const current = record && currentMeasurementValue(record);
    if (!record || !current) return [];
    const unit = resolveUnit(current.originalUnit); const semantics = measurementSemantics(record.measurementType);
    if (!unit || semantics.kind === 'categorical' || (semantics.kind === 'dimensional' && unit.dimension !== semantics.dimension)) return [];
    return unitsForDimension(unit.dimension).flatMap((target) => target.symbol === unit.symbol ? [] : [convertUnit(current.originalValue, unit.symbol, target.symbol, record.id)!]);
  }
  standardSizeConversions(recordId: string, context: FootwearContext = 'adult_simplified'): ConversionResult[] {
    const record = this.data.standardSizes.find((item) => item.id === recordId);
    return record?.category === 'Footwear' ? footwearConversions(record.sizingSystem, record.sizeValue, context, record.id) : [];
  }
  brandFitConversions(recordId: string, context: FootwearContext = 'adult_simplified'): ConversionResult[] {
    const record = this.data.brandFits.find((item) => item.id === recordId);
    return record?.category === 'Footwear' ? footwearConversions(record.sizingSystem, record.sizeValue, context, record.id) : [];
  }
  private requireProfile(id: string): Profile { const profile = this.data.profiles.find((item) => item.id === id); if (!profile) throw new Error('Profile not found.'); return profile; }
  private ensureWritable(): void { if (this.loadResult.status === 'corrupt' || this.loadResult.status === 'unsupported_version') throw new Error('Stored Sigma data must be reset before new data can be saved.'); }
  private makeValue(input: Omit<MeasurementValue, 'id' | 'createdAt'>, createdAt: string): MeasurementValue { return { ...input, id: this.id(), createdAt }; }
  private persist(): void {
    if (this.loadResult.status === 'corrupt' || this.loadResult.status === 'unsupported_version') throw new Error('Stored Sigma data must be reset before new data can be saved.');
    this.repository.save(this.data);
    this.loadResult = { status: 'ok', data: this.data };
  }
}

function clean(value?: string): string | undefined { const result = value?.trim(); return result || undefined; }
