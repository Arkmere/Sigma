import test from 'node:test';
import assert from 'node:assert/strict';
import { mountApp } from '../dist/app/app.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';

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
    if (selector !== '[data-route]') return [];
    if (this.controls.has(selector)) return this.controls.get(selector);
    const controls = [];
    for (const match of this.html.matchAll(/data-route="([^"]+)"/g)) controls.push(new Control({ route: match[1] }));
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
  for (const [route, expected] of [['profiles', /Profiles/], ['measurements', /Create a profile before adding records/], ['family', /sharing are not implemented/], ['privacy', /Local-only data/], ['settings', /Theme preference/]]) {
    const button = root.querySelectorAll('[data-route]').find((item) => item.dataset.route === route);
    assert.ok(button); button.click(); assert.match(root.textContent, expected);
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
