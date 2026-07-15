import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA_STORAGE_KEY, LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';

function storage(initial) { const values = new Map(initial === undefined ? [] : [[DATA_STORAGE_KEY, initial]]); return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) }; }
function validData() { return { schemaVersion: 1, activeProfileId: 'p1', profiles: [{ id: 'p1', displayName: 'Alex', profileType: 'independent', createdAt: '2026-01-01', updatedAt: '2026-01-01' }], measurements: [], standardSizes: [], brandFits: [] }; }

test('empty storage is distinguished and valid schema-1 data migrates to schema 2', () => {
  assert.equal(new LocalStorageRepository(storage()).load().status, 'empty');
  const result = new LocalStorageRepository(storage(JSON.stringify(validData()))).load();
  assert.equal(result.status, 'ok'); assert.equal(result.data.schemaVersion, 2); assert.equal(result.data.profiles[0].displayName, 'Alex'); assert.equal(result.data.activeActorProfileId,'p1'); assert.deepEqual(result.data.sharingGrants,[]);
});

test('invalid JSON and structurally invalid version-one data are corrupt', () => {
  assert.equal(new LocalStorageRepository(storage('{no')).load().status, 'corrupt');
  assert.equal(new LocalStorageRepository(storage(JSON.stringify({ ...validData(), profiles: 'wrong' }))).load().status, 'corrupt');
});

test('future versions are unsupported and missing profile references are corrupt', () => {
  assert.equal(new LocalStorageRepository(storage(JSON.stringify({ ...validData(), schemaVersion: 99 }))).load().status, 'unsupported_version');
  const orphan = { ...validData(), measurements: [{ id: 'm1', profileId: 'missing', kind: 'measurement', measurementType: 'Waist', category: 'Upper body', label: 'Waist', values: [], visibility: 'private', createdAt: 'x', updatedAt: 'x' }] };
  assert.equal(new LocalStorageRepository(storage(JSON.stringify(orphan))).load().status, 'corrupt');
});

test('load never overwrites unsafe raw data and service exposes safety status', () => {
  for (const raw of ['{bad', JSON.stringify({ ...validData(), schemaVersion: 99 })]) {
    const local = storage(raw); const service = new SigmaService(new LocalStorageRepository(local));
    assert.ok(['corrupt', 'unsupported_version'].includes(service.storageStatus().status));
    assert.throws(() => service.createProfile({ displayName: 'New', profileType: 'independent' }), /must be reset/);
    assert.equal(local.getItem(DATA_STORAGE_KEY), raw);
  }
});

test('confirmed service reset clears unsafe data and permits normal persistence', () => {
  const local = storage('{bad'); const service = new SigmaService(new LocalStorageRepository(local));
  service.reset(); assert.equal(service.storageStatus().status, 'empty'); assert.equal(local.getItem(DATA_STORAGE_KEY), null);
  service.createProfile({ displayName: 'Alex', profileType: 'independent' });
  assert.equal(service.storageStatus().status, 'ok'); assert.ok(local.getItem(DATA_STORAGE_KEY));
});

test('schema-1 migration preserves every fact and leaves legacy managed authority unassigned',()=>{
  const old={...validData(),profiles:[...validData().profiles,{id:'p2',displayName:'Sam',profileType:'managed',createdAt:'2026-01-01',updatedAt:'2026-01-01'}],measurements:[{id:'m1',profileId:'p2',kind:'measurement',measurementType:'Waist',category:'Upper body',label:'Waist',visibility:'private',createdAt:'x',updatedAt:'x',values:[{id:'v1',value:90,unit:'cm',originalValue:90,originalUnit:'cm',measuredAt:'2026-01-01',recordedAt:'2026-01-01',sourceType:'manual',acquisitionMethod:'manual',createdAt:'x'},{id:'v2',value:89,unit:'cm',originalValue:89,originalUnit:'cm',measuredAt:'2026-02-01',recordedAt:'2026-02-01',sourceType:'manual',acquisitionMethod:'manual',createdAt:'x'}]}],standardSizes:[{id:'s1',profileId:'p2',kind:'standard_size',category:'Footwear',label:'Shoe',sizingSystem:'UK',sizeValue:'7',recordedAt:'x',sourceType:'manual',visibility:'private',createdAt:'x',updatedAt:'x'}],brandFits:[{id:'b1',profileId:'p2',kind:'brand_fit',category:'Footwear',brand:'Nike',sizingSystem:'UK',sizeValue:'7',recordedAt:'x',sourceType:'manual',visibility:'private',createdAt:'x',updatedAt:'x'}]};
  const result=new LocalStorageRepository(storage(JSON.stringify(old))).load();assert.equal(result.status,'ok');assert.equal(result.data.measurements[0].values.length,2);assert.equal(result.data.standardSizes[0].id,'s1');assert.equal(result.data.brandFits[0].id,'b1');assert.equal(result.data.profiles[1].managedByProfileIds,undefined);const service=new SigmaService(new LocalStorageRepository(storage(JSON.stringify(old))));assert.equal(service.records('p2').measurements.length,1);
});
