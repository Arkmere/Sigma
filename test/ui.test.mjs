import test from 'node:test';
import assert from 'node:assert/strict';
import { mountApp } from '../dist/app/app.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';
import { renderRecords } from '../dist/app/ui/records.js';
import { renderProfiles } from '../dist/app/ui/profiles.js';

class Control {
  constructor(attributes, value='') { this.dataset = attributes; this.value = value; this.listeners = new Map(); this.selectionStart=value.length; this.selectionEnd=value.length; this.focused=false; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  click() { this.listeners.get('click')?.({ currentTarget: this }); }
  input(value) { this.value=value; this.selectionStart=value.length; this.selectionEnd=value.length; this.listeners.get('input')?.({currentTarget:this}); }
  change(value) { this.value=value; this.listeners.get('change')?.({currentTarget:this}); }
  focus() { this.focused=true; }
  setSelectionRange(start,end) { this.selectionStart=start; this.selectionEnd=end; }
}

class Root {
  set innerHTML(value) { this.html = value; this.controls = new Map(); }
  get innerHTML() { return this.html; }
  get textContent() { return this.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  querySelector(selector) {
    if(selector==='#record-search'){
      if(this.controls.has(selector))return this.controls.get(selector)[0]??null;
      const match=this.html.match(/id="record-search" value="([^"]*)"/);const controls=match?[new Control({},match[1])]:[];this.controls.set(selector,controls);return controls[0]??null;
    }
    return null;
  }
  querySelectorAll(selector) {
    if (this.controls.has(selector)) return this.controls.get(selector);
    const controls = [];
    if (selector === '[data-route]') for (const match of this.html.matchAll(/data-route="([^"]+)"/g)) controls.push(new Control({ route: match[1] }));
    if (selector === '[data-source-action]') for (const match of this.html.matchAll(/data-source-action="([^"]+)"/g)) controls.push(new Control({ sourceAction: match[1] }));
    if (selector === '[data-permission-allow]') for (const match of this.html.matchAll(/data-permission-allow="([^"]+)"/g)) controls.push(new Control({ permissionAllow: match[1] }));
    if (selector === '#actor-select,#context-actor-select' && this.html.includes('id="context-actor-select"')) controls.push(new Control({}));
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
  assert.match(root.textContent, /Create my profile/);
  for (const [route, expected] of [['profiles', /People/], ['measurements', /No profile is available to the acting adult/], ['family', /Family workflows are locked/], ['sources', /How imports are filtered/], ['privacy', /Who can see profiles/], ['settings', /Family entitlement/]]) {
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
  assert.match(root.textContent, /96 cm/); assert.match(root.textContent, /History \(2\)/); assert.match(root.textContent, /Standard sizes/); assert.match(root.textContent, /Brand &amp; product facts/);
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
  assert.match(sizes, /Standard equivalents/); assert.match(sizes, /Approximate standard equivalent/); assert.match(sizes, /ISO 19407:2023/); assert.match(sizes, /T-shirt/);
});

test('new-record creation uses the canonical picker and keeps custom creation secondary', () => {
  const local = storage(); const service = new SigmaService(new LocalStorageRepository(local), () => '2026-07-15T12:00:00Z', () => 'profile-1');
  service.createProfile({ displayName: 'Alex', profileType: 'independent' });
  const html = renderRecords(service, 'measurement', '', '');
  assert.match(html, /id="canonical-fact-search"/);
  assert.match(html, /value="measurement.height"[^>]*>General body dimensions · Height<\/option>/);
  assert.match(html, /Create custom fact/);
  assert.doesNotMatch(html, /name="label" required/);
});

test('ordinary profile editing cannot change type and genuinely shared viewers see no mutation controls',()=>{const local=storage();let n=0;const service=new SigmaService(new LocalStorageRepository(local),()=> '2026-07-15T12:00:00Z',()=>`id-${++n}`);const alex=service.createProfile({displayName:'Alex',profileType:'independent'});service.addMeasurement({profileId:alex.id,measurementType:'Waist',category:'Upper body',label:'Waist',value:90,unit:'cm',originalValue:90,originalUnit:'cm',measuredAt:'2026-07-15',recordedAt:'2026-07-15',sourceType:'manual',acquisitionMethod:'manual'});const jordan=service.createProfile({displayName:'Jordan',profileType:'independent'});const profileHtml=renderProfiles(service,alex.id,true);assert.match(profileHtml,/Profile type cannot be changed/);assert.doesNotMatch(profileHtml,/name="profileType"/);const request=service.requestConnection(jordan.id);service.selectActor(jordan.id);service.respondConnection(request.id,true);service.selectActor(alex.id);service.grantAccess(alex.id,jordan.id,{type:'profile'});service.selectActor(jordan.id);service.selectProfile(alex.id);const recordsHtml=renderRecords(service,'measurement','','');assert.match(recordsHtml,/read-only/i);assert.doesNotMatch(recordsHtml,/id="record-form"|data-history-form|data-edit-measurement-form/);});

test('imported standard-size cards show source details without measured language',()=>{const local=storage();const service=new SigmaService(new LocalStorageRepository(local),()=> '2026-07-15T12:00:00Z',()=>crypto.randomUUID());const profile=service.createProfile({displayName:'Alex',profileType:'independent'});service.addStandardSize({profileId:profile.id,category:'Clothing',label:'Clothing size',sizingSystem:'Generic',sizeValue:'M',recordedAt:'2026-07-01',sourceType:'imported_device',sourceName:'Measurement device',sourceId:'measurement_device',sourceItemId:'size-1',sourceDevice:'Demo wardrobe',confidence:0.9,derivation:{kind:'derived',method:'demo'}});const html=renderRecords(service,'standard_size','','');assert.match(html,/Source details/);assert.match(html,/imported device · Measurement device/);assert.doesNotMatch(html,/measured 1 Jul 2026/);});

test('simulated permission cannot activate a future source',()=>{const local=storage();globalThis.localStorage=local;globalThis.matchMedia=()=>({matches:false});globalThis.document={documentElement:{dataset:{}}};const service=new SigmaService(new LocalStorageRepository(local));const root=new Root();mountApp(root,service);root.querySelectorAll('[data-route]').find(item=>item.dataset.route==='sources').click();assert.match(root.textContent,/Future integration/);root.querySelectorAll('[data-source-action]').find(item=>item.dataset.sourceAction==='smart_scale').click();assert.match(root.textContent,/Simulate allow/);root.querySelectorAll('[data-permission-allow]')[0].click();assert.match(root.textContent,/not implemented in the current local demo/);assert.match(root.textContent,/does not activate it/);assert.equal(service.snapshot().measurements.length,0);});

test('Ticket 6 first use includes account-free guidance and an accessible live notice region',()=>{
  const local=storage();globalThis.localStorage=local;globalThis.matchMedia=()=>({matches:false});globalThis.document={documentElement:{dataset:{}}};
  const root=new Root();mountApp(root,new SigmaService(new LocalStorageRepository(local)));
  assert.match(root.textContent,/useful measurements and sizes on this device/i);
  assert.match(root.textContent,/No account is required/);
  assert.match(root.innerHTML,/aria-live="polite"/);
  assert.match(root.innerHTML,/id="open-profile-form"/);
});

test('Ticket 6 record entry is progressively disclosed and filters can be cleared',()=>{
  const local=storage();
  const service=new SigmaService(new LocalStorageRepository(local));service.createProfile({displayName:'Alex',profileType:'independent'});
  assert.doesNotMatch(renderRecords(service,'measurement','','',false),/id="record-form"/);
  const open=renderRecords(service,'measurement','','',true);assert.match(open,/id="record-form"/);assert.match(open,/Cancel/);
  const filtered=renderRecords(service,'measurement','waist','Upper body',false);assert.match(filtered,/>Clear</);assert.match(filtered,/No matching records/);
});

test('record search preserves focus, caret and sequential input across rerenders',()=>{
  const local=storage();const service=new SigmaService(new LocalStorageRepository(local));service.createProfile({displayName:'Alex',profileType:'independent'});
  globalThis.localStorage=local;globalThis.matchMedia=()=>({matches:false});globalThis.document={documentElement:{dataset:{}}};
  const root=new Root();mountApp(root,service);root.querySelectorAll('[data-route]').find(item=>item.dataset.route==='measurements').click();
  for(const value of ['w','wa','wai','wais','waist']){
    const input=root.querySelector('#record-search');input.input(value);
    const replacement=root.querySelector('#record-search');assert.equal(replacement.value,value);assert.equal(replacement.focused,true);assert.equal(replacement.selectionStart,value.length);
  }
});

test('notices clear on route navigation and a new action replaces the previous notice',()=>{
  const local=storage();const service=new SigmaService(new LocalStorageRepository(local));service.createProfile({displayName:'Alex',profileType:'independent'});const jordan=service.createProfile({displayName:'Jordan',profileType:'independent'});
  globalThis.localStorage=local;globalThis.matchMedia=()=>({matches:false});globalThis.document={documentElement:{dataset:{}}};
  const root=new Root();mountApp(root,service);
  root.querySelectorAll('#actor-select,#context-actor-select')[0].change(jordan.id);assert.match(root.textContent,/Acting local adult switched/);
  root.querySelectorAll('#actor-select,#context-actor-select')[0].change('missing');assert.doesNotMatch(root.textContent,/Acting local adult switched/);assert.match(root.textContent,/Profile not found/);
  root.querySelectorAll('[data-route]').find(item=>item.dataset.route==='sources').click();assert.doesNotMatch(root.textContent,/Profile not found/);
});

test('Ticket 6 unsafe storage suppresses ordinary route content and export',()=>{
  const local=storage();local.setItem('sigma.data.v1','{broken');globalThis.localStorage=local;globalThis.matchMedia=()=>({matches:false});globalThis.document={documentElement:{dataset:{}}};
  const root=new Root();mountApp(root,new SigmaService(new LocalStorageRepository(local)));
  for(const route of ['profiles','measurements','settings']){root.querySelectorAll('[data-route]').find(item=>item.dataset.route===route).click();assert.match(root.textContent,/raw stored value remains untouched/i);assert.doesNotMatch(root.innerHTML,/id="export-data"/);}
});
