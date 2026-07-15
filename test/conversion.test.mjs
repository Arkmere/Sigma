import test from 'node:test';
import assert from 'node:assert/strict';
import { convertUnit, formatConvertedValue, footwearConversions, measurementDimension, resolveUnit, ringCircumferenceFromDiameter, ringDiameterFromCircumference, isoRingSizeFromCircumference } from '../dist/conversion/registry.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';

const close = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} was not within ${tolerance} of ${expected}`);
const memoryStorage = () => { const values = new Map(); return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) }; };
function fixture() { const storage = memoryStorage(); let n = 0; const service = new SigmaService(new LocalStorageRepository(storage), () => '2026-07-15T12:00:00Z', () => `id-${++n}`); const profile = service.createProfile({ displayName: 'Alex', profileType: 'independent' }); return { storage, service, profile }; }

test('converts every supported exact family through canonical bases and formats only at display time', () => {
  const inches = convertUnit(41, 'cm', 'in');
  assert.equal(formatConvertedValue(inches.outputValue, 'in'), '16.14');
  assert.equal(convertUnit(1, 'in', 'mm').outputValue, 25.4);
  close(convertUnit(1, 'ft', 'in').outputValue, 12);
  close(convertUnit(1, 'kg', 'lb').outputValue, 2.2046226218487757);
  close(convertUnit(1, 'st', 'lb').outputValue, 14);
  const raw = convertUnit(41, 'cm', 'in').outputValue;
  assert.notEqual(raw, Number(formatConvertedValue(raw, 'in')));
  close(convertUnit(raw, 'in', 'cm').outputValue, 41);
});

test('resolves aliases centrally and refuses unknown or cross-dimensional conversions', () => {
  assert.equal(resolveUnit('centimetres').symbol, 'cm');
  assert.equal(resolveUnit('LBS').symbol, 'lb');
  assert.equal(convertUnit(2, 'furlong', 'm'), undefined);
  assert.equal(convertUnit(2, 'cm', 'kg'), undefined);
});

test('measurement taxonomy separates mass, length, categorical and custom semantics', () => {
  assert.equal(measurementDimension('Weight'), 'mass');
  assert.equal(measurementDimension('Waist'), 'length');
  assert.equal(measurementDimension('T-shirt size'), undefined);
  assert.equal(measurementDimension('Custom measurement'), undefined);
});

test('service derives measurement alternatives without mutating facts, history or persistence', () => {
  const { storage, service, profile } = fixture();
  const record = service.addMeasurement({ profileId: profile.id, measurementType: 'Waist', category: 'Upper body', label: 'Waist', value: 41, unit: 'centimetres', originalValue: 41, originalUnit: 'centimetres', measuredAt: '2026-07-01', recordedAt: '2026-07-01', sourceType: 'manual', acquisitionMethod: 'manual' });
  service.addMeasurementValue(record.id, { value: 42, unit: 'cm', originalValue: 42, originalUnit: 'cm', measuredAt: '2026-07-02', recordedAt: '2026-07-02', sourceType: 'manual', acquisitionMethod: 'manual' });
  const before = storage.getItem('sigma.data.v1'); const snapshot = service.snapshot();
  assert.equal(service.measurementConversions(record.id).length, 4);
  assert.deepEqual(service.snapshot(), snapshot); assert.equal(storage.getItem('sigma.data.v1'), before);
  assert.equal(snapshot.measurements[0].values[0].originalUnit, 'centimetres');
  assert.equal(snapshot.measurements[0].values.length, 2);
  assert.doesNotMatch(JSON.stringify(service.exportBackup()), /exact_unit|standard_equivalent|outputSystem/);
});

test('unsupported custom measurement units remain recorded and produce no result', () => {
  const { service, profile } = fixture();
  const record = service.addMeasurement({ profileId: profile.id, measurementType: 'Custom measurement', category: 'Custom', label: 'Stride code', value: 7, unit: 'paces', originalValue: 7, originalUnit: 'paces', measuredAt: '2026-07-01', recordedAt: '2026-07-01', sourceType: 'manual', acquisitionMethod: 'manual' });
  assert.deepEqual(service.measurementConversions(record.id), []);
  assert.equal(service.snapshot().measurements[0].values[0].unit, 'paces');
});

test('footwear subset is non-exact, context-bound, sex-specific and never interpolated', () => {
  const result = footwearConversions('UK', '9');
  assert.deepEqual(result.map((item) => [item.outputSystem, item.outputValue]), [['EU', '43'], ["US Men's", '10']]);
  assert.ok(result.every((item) => item.kind === 'standard_equivalent' && item.exact === false && item.source.version.includes('ISO 19407:2023')));
  assert.deepEqual(footwearConversions('UK', '9', 'child'), []);
  assert.deepEqual(footwearConversions('US', '9'), []);
  assert.deepEqual(footwearConversions('UK', '9.5'), []);
  assert.ok(!result.some((item) => item.outputSystem === "US Women's"));
});

test('standard and brand footwear derivation preserves each independent recorded fact', () => {
  const { service, profile } = fixture();
  const size = service.addStandardSize({ profileId: profile.id, category: 'Footwear', label: 'General shoe size', sizingSystem: 'UK', sizeValue: '9', recordedAt: '2026-07-15', sourceType: 'manual' });
  const brand = service.addBrandFit({ profileId: profile.id, category: 'Footwear', brand: 'Nike', productName: 'Air Max 90', sizingSystem: 'UK', sizeValue: '9', recordedAt: '2026-07-15', sourceType: 'manual' });
  const before = service.snapshot();
  assert.equal(service.standardSizeConversions(size.id).length, 2); assert.equal(service.brandFitConversions(brand.id).length, 2);
  assert.deepEqual(service.snapshot(), before); assert.equal(before.brandFits.length, 1);
});

test('ring conversions are deterministic and regional sizes are outside the registry', () => {
  const diameter = ringDiameterFromCircumference(54);
  close(ringCircumferenceFromDiameter(diameter.outputValue).outputValue, 54);
  const iso = isoRingSizeFromCircumference(54);
  assert.equal(iso.outputValue, 54); assert.equal(iso.outputSystem, 'ISO ring size');
  assert.equal(resolveUnit('UK ring N'), undefined);
});
