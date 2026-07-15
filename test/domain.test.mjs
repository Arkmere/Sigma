import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

function serviceFixture() {
  const storage = memoryStorage();
  let sequence = 0;
  const service = new SigmaService(new LocalStorageRepository(storage), () => '2026-07-14T12:00:00.000Z', () => `id-${++sequence}`);
  return { service, storage };
}

test('creates independent profiles and persists active actor and viewed selection', () => {
  const { service, storage } = serviceFixture();
  const personal = service.createProfile({ displayName: 'Alex', profileType: 'independent' });
  const jordan = service.createProfile({ displayName: 'Jordan', profileType: 'independent' });
  service.selectProfile(jordan.id); service.selectActor(personal.id);
  const reloaded = new SigmaService(new LocalStorageRepository(storage));
  assert.deepEqual(reloaded.snapshot().profiles.map((profile) => profile.profileType), ['independent', 'independent']);
  assert.equal(reloaded.activeProfile()?.id, jordan.id); assert.equal(reloaded.activeActor()?.id,personal.id);
  assert.equal(personal.displayName, 'Alex');
});

test('stores all record kinds against the correct profile with provenance', () => {
  const { service, storage } = serviceFixture();
  const alex = service.createProfile({ displayName: 'Alex', profileType: 'independent' });
  const sam = service.createProfile({ displayName: 'Sam', profileType: 'independent' });
  service.addMeasurement({ profileId: alex.id, measurementType: 'Waist', category: 'Upper body', label: 'Waist', value: 98, unit: 'cm', measuredAt: '2026-04-12', recordedAt: '2026-04-12T10:00:00Z', sourceType: 'manual', sourceName: 'Home tape', originalValue: 98, originalUnit: 'cm', acquisitionMethod: 'manual' });
  service.addStandardSize({ profileId: alex.id, category: 'Footwear', label: 'Shoe size', sizingSystem: 'UK', sizeValue: '9', recordedAt: '2026-07-14', sourceType: 'manual' });
  const fit = service.addBrandFit({ profileId: sam.id, category: 'Footwear', brand: 'Nike', productName: 'Air Max 90', sizingSystem: 'UK', sizeValue: '7', recordedAt: '2026-07-14', sourceType: 'manual' });
  service.updateBrandFit(fit.id, { category: 'Footwear', brand: 'Nike', productName: 'Air Max 90', productLine: undefined, sizingSystem: 'UK', sizeValue: '7.5', fitNotes: 'Recorded snug fit' });
  const reloaded = new SigmaService(new LocalStorageRepository(storage));
  assert.equal(reloaded.records(alex.id).measurements[0].values[0].sourceName, 'Home tape');
  assert.equal(reloaded.records(alex.id).standardSizes[0].sizeValue, '9');
  assert.equal(reloaded.records(alex.id).brandFits.length, 0);
  assert.equal(reloaded.records(sam.id).brandFits[0].sizeValue, '7.5');
});

test('preserves measurement history and identifies current value by measured date', () => {
  const { service } = serviceFixture();
  const profile = service.createProfile({ displayName: 'Alex', profileType: 'independent' });
  const waist = service.addMeasurement({ profileId: profile.id, measurementType: 'Waist', category: 'Upper body', label: 'Waist', value: 98, unit: 'cm', measuredAt: '2026-04-12', recordedAt: '2026-04-12', sourceType: 'manual', originalValue: 98, originalUnit: 'cm', acquisitionMethod: 'manual' });
  const updated = service.addMeasurementValue(waist.id, { value: 96, unit: 'cm', measuredAt: '2026-07-09', recordedAt: '2026-07-09', sourceType: 'manual', sourceName: 'Home', originalValue: 96, originalUnit: 'cm', acquisitionMethod: 'manual' });
  assert.equal(updated.values.length, 2);
  assert.equal(service.currentValue(updated)?.value, 96);
  assert.equal(updated.values[0].value, 98);
});

test('searches labels, categories, brands and products and exports versioned data', () => {
  const { service } = serviceFixture();
  const profile = service.createProfile({ displayName: 'Alex', profileType: 'independent' });
  service.addBrandFit({ profileId: profile.id, category: 'Footwear', brand: 'Globe', productName: 'Tilt', sizingSystem: 'UK', sizeValue: '10', recordedAt: '2026-07-14', sourceType: 'manual' });
  assert.equal(service.records(profile.id, 'tilt').brandFits.length, 1);
  assert.equal(service.records(profile.id, '', 'Clothing').brandFits.length, 0);
  const backup = service.exportBackup();
  assert.equal(backup.product, 'Sigma');
  assert.equal(backup.schemaVersion, 2);
  assert.equal(backup.profiles.length, 1);
  assert.equal(backup.brandFits.length, 1);
  assert.ok(backup.exportedAt);
});
