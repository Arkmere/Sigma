import test from 'node:test';
import assert from 'node:assert/strict';
import { mountApp } from '../dist/app/app.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';
import { renderRecords } from '../dist/app/ui/records.js';

class Control {
  constructor(attributes) { this.dataset = attributes; this.value = ''; this.listeners = new Map(); }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  click() { this.listeners.get('click')?.({ currentTarget: this }); }
}

class Root {
  set innerHTML(value) { this.html = value; this.controls = new Map(); }
  get innerHTML() { return this.html; }
  get textContent() { return this.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  querySelector() { return null; }
  querySelectorAll(selector) {
    if (this.controls.has(selector)) return this.controls.get(selector);
    const controls = [];
    if (selector === '[data-route]') for (const match of this.html.matchAll(/data-route="([^"]+)"/g)) controls.push(new Control({ route: match[1] }));
    if (selector === '#reset-data' && this.html.includes('id="reset-data"')) controls.push(new Control({}));
    this.controls.set(selector, controls);
    return controls;
  }
}

const storage = () => { const values = new Map(); return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; };

test('shell renders truthful empty states and switches every primary route without crashing', () => {
  globalThis.localStorage = storage();
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.document = { documentElement: { dataset: {} } };
  const root = new Root();
  mountApp(root, new SigmaService(new LocalStorageRepository(globalThis.localStorage)));
  assert.match(root.textContent, /Start with a person, not an account/);
  for (const [route, expected] of [['profiles', /Profiles/], ['measurements', /Create a profile before adding records/], ['family', /Family workflows are locked/], ['privacy', /Who can see profiles/], ['settings', /Family entitlement/]]) {
    const button = root.querySelectorAll('[data-route]').find((item) => item.dataset.route === route);
    assert.ok(button); button.click(); assert.match(root.textContent, expected);
  }
});

test('unsafe storage renders warnings and reset still requires confirmation', () => {
  for (const [raw, expected] of [['{bad', /corrupt or does not match/], [JSON.stringify({ schemaVersion: 99 }), /unsupported schema version 99/]]) {
    const local = storage(); local.setItem('sigma.data.v1', raw); const service = new SigmaService(new LocalStorageRepository(local));
    globalThis.localStorage = local; globalThis.matchMedia = () => ({ matches: false }); globalThis.document = { documentElement: { dataset: {} } }; globalThis.confirm = () => false;
    const root = new Root(); mountApp(root, service); assert.match(root.textContent, /could not read safely/); assert.match(root.textContent, expected);
    root.querySelectorAll('#reset-data')[0].click(); assert.equal(local.getItem('sigma.data.v1'), raw);
  }
});

test('profile-aware UI shows physical, standard-size and brand-fit records with history', () => {
  const local = storage(); const service = new SigmaService(new LocalStorageRepository(local), () => '2026-07-14T12:00:00Z', (() => { let n = 0; return () => `id-${++n}`; })());
  const profile = service.createProfile({ displayName: 'Alex', profileType: 'independent' });
  const record = service.addMeasurement({ profileId: profile.id, measurementType: 'Waist', category: 'Upper body', label: 'Waist', value: 98, unit: 'cm', measuredAt: '2026-04-12', recordedAt: '2026-04-12', sourceType: 'manual', originalValue: 98, originalUnit: 'cm', acquisitionMethod: 'manual' });
  service.addMeasurementValue(record.id, { value: 96, unit: 'cm', measuredAt: '2026-07-09', recordedAt: '2026-07-09', sourceType: 'manual', originalValue: 96, originalUnit: 'cm', acquisitionMethod: 'manual' });
  service.addStandardSize({ profileId: profile.id, category: 'Footwear', label: 'Shoe size', sizingSystem: 'UK', sizeValue: '9', recordedAt: '2026-07-14', sourceType: 'manual' });
  service.addBrandFit({ profileId: profile.id, category: 'Footwear', brand: 'Nike', productName: 'Air Max 90', sizingSystem: 'UK', sizeValue: '9', recordedAt: '2026-07-14', sourceType: 'manual' });
  globalThis.localStorage = local; globalThis.matchMedia = () => ({ matches: false }); globalThis.document = { documentElement: { dataset: {} } };
  const root = new Root(); mountApp(root, service);
  root.querySelectorAll('[data-route]').find((item) => item.dataset.route === 'measurements').click();
  assert.match(root.textContent, /96 cm/); assert.match(root.textContent, /History & provenance \(2\)/); assert.match(root.textContent, /Standard sizes/); assert.match(root.textContent, /Brand & product/);
});

test('record cards distinguish recorded facts, exact conversions, standard equivalents and sources', () => {
  const local = storage(); const service = new SigmaService(new LocalStorageRepository(local), () => '2026-07-15T12:00:00Z', (() => { let n = 0; return () => `id-${++n}`; })());
  const profile = service.createProfile({ displayName: 'Alex', profileType: 'independent' });
  service.addMeasurement({ profileId: profile.id, measurementType: 'Neck/collar', category: 'Upper body', label: 'Neck / collar', value: 41, unit: 'cm', originalValue: 41, originalUnit: 'cm', measuredAt: '2026-07-15', recordedAt: '2026-07-15', sourceType: 'manual', acquisitionMethod: 'manual' });
  service.addStandardSize({ profileId: profile.id, category: 'Footwear', label: 'General shoe size', sizingSystem: 'UK', sizeValue: '9', recordedAt: '2026-07-15', sourceType: 'manual' });
  service.addStandardSize({ profileId: profile.id, category: 'Clothing', label: 'T-shirt', sizingSystem: 'Generic', sizeValue: 'M', recordedAt: '2026-07-15', sourceType: 'manual' });
  const physical = renderRecords(service, 'measurement', '', '');
  assert.match(physical, /Recorded directly/); assert.match(physical, /16.14 in/); assert.match(physical, /Exact conversion/); assert.match(physical, /National Institute of Standards and Technology/);
  const sizes = renderRecords(service, 'standard_size', '', '');
  assert.match(sizes, /Standard equivalents/); assert.match(sizes, /Approximate standard equivalent/); assert.match(sizes, /ISO 19407:2023/); assert.match(sizes, /No supported deterministic conversion/);
});

test('new-record taxonomy marks categorical sizes without a length dimension selector', () => {
  const local = storage(); const service = new SigmaService(new LocalStorageRepository(local), () => '2026-07-15T12:00:00Z', () => 'profile-1');
  service.createProfile({ displayName: 'Alex', profileType: 'independent' });
  const html = renderRecords(service, 'measurement', '', '');
  assert.match(html, /<option value="General shoe size" data-semantics="categorical" data-dimension="">Footwear · General shoe size<\/option>/);
  assert.doesNotMatch(html, /<option value="General shoe size"[^>]*data-dimension="length"/);
});
