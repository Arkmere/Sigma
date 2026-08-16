import test from 'node:test';
import assert from 'node:assert/strict';
import { anatomyChildRegions, anatomyDiscoverableFacts, anatomyFactsAtPath, anatomyPathKey } from '../dist/domain/anatomy-discovery.js';
import { anatomyModelFamilyIds } from '../dist/domain/anatomy.js';
import { canonicalFactById } from '../dist/domain/canonical-facts.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';
import { renderRecords } from '../dist/app/ui/records.js';
import { readFile } from 'node:fs/promises';

const ids = (facts) => facts.map((fact) => fact.id);
const childNames = (path) => anatomyChildRegions(path).map((child) => child.at(-1));

test('anatomy discovery includes exactly the supported guided illustrated measurements', () => {
  const facts=anatomyDiscoverableFacts();
  assert.equal(facts.length,35);
  assert.ok(facts.every((fact)=>fact.recordKind==='measurement'&&fact.anatomyPath&&fact.guidance));
  assert.ok(facts.every((fact)=>fact.id.startsWith('measurement.')));
  for(const excluded of ['measurement.body-length','measurement.middle-finger-length','measurement.necklace-length','measurement.watch-band-length','measurement.bike-frame-measurement','size.glove-size','brand.glove-size'])assert.ok(!ids(facts).includes(excluded),excluded);
});

test('anatomy hierarchy and facts are derived at their exact semantic paths',()=>{
  assert.deepEqual(childNames(['Body']),['Head and neck','Torso','Upper limbs','Lower limbs']);
  assert.ok(childNames(['Body','Upper limbs']).includes('Hand'));
  assert.deepEqual(childNames(['Body','Upper limbs','Hand']),['Fingers']);
  assert.deepEqual(childNames(['Body','Lower limbs']),['Foot']);
  assert.ok(ids(anatomyFactsAtPath(['Body','Upper limbs','Hand'])).includes('measurement.hand-width'));
  assert.ok(ids(anatomyFactsAtPath(['Body','Upper limbs','Hand','Fingers'])).includes('measurement.finger-circumference'));
  assert.ok(ids(anatomyFactsAtPath(['Body','Lower limbs','Foot'])).includes('measurement.foot-length'));
  assert.ok(!ids(anatomyFactsAtPath(['Body','Lower limbs','Foot'])).includes('measurement.hand-width'));
  assert.equal(anatomyPathKey(['Body','Upper limbs','Hand']),'Body > Upper limbs > Hand');
});

test('presentation family cannot change anatomy discovery results',()=>{
  const expected=ids(anatomyDiscoverableFacts());
  for(const family of anatomyModelFamilyIds){assert.ok(['neutral','masculine','feminine'].includes(family));assert.deepEqual(ids(anatomyDiscoverableFacts()),expected);}
  assert.ok(expected.includes('measurement.bust-circumference'));
  assert.ok(expected.includes('measurement.underbust-circumference'));
});

test('editable measurement form exposes semantic progressive controls and canonical handoff metadata',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  const service=new SigmaService(new LocalStorageRepository(storage),undefined,()=>crypto.randomUUID());service.createProfile({displayName:'Alex',profileType:'independent'});
  const html=renderRecords(service,'measurement','','');
  assert.match(html,/id="open-anatomy-discovery"[^>]*aria-expanded="false"/);
  assert.match(html,/data-anatomy-path="Body &gt; Upper limbs"[^>]*aria-label="Browse Upper limbs"/);
  assert.match(html,/data-anatomy-path="Body &gt; Upper limbs &gt; Hand"/);
  assert.match(html,/data-anatomy-fact="measurement.hand-width">Hand width/);
  assert.match(html,/data-anatomy-fact="measurement.foot-length">Foot length/);
  assert.match(html,/aria-label="Back to Upper limbs"/);
  const hand=canonicalFactById('measurement.hand-width');assert.equal(hand.measurement.defaultUnit,'cm');assert.ok(hand.guidance);assert.match(html,/value="measurement.hand-width"/);assert.match(html,/data-guidance-id="measurement.hand-width"/);
});

test('read-only profiles expose no anatomy discovery or record form and navigator state is not persisted',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};let n=0;
  const service=new SigmaService(new LocalStorageRepository(storage),()=> '2026-08-10T12:00:00Z',()=>`id-${++n}`),owner=service.createProfile({displayName:'Owner',profileType:'independent'}),viewer=service.createProfile({displayName:'Viewer',profileType:'independent'});const request=service.requestConnection(viewer.id);service.selectActor(viewer.id);service.respondConnection(request.id,true);service.selectActor(owner.id);service.grantAccess(owner.id,viewer.id,{type:'profile'});service.selectActor(viewer.id);service.selectProfile(owner.id);
  const html=renderRecords(service,'measurement','','');assert.doesNotMatch(html,/open-anatomy-discovery|record-form/);
  const backup=service.exportBackup();assert.equal(backup.schemaVersion,5);assert.doesNotMatch(JSON.stringify(backup),/discoveryMode|currentAnatomyPath|anatomy-discovery/);
});

test('back to Body has a visible semantic opener as its context-preserving focus target',async()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  const service=new SigmaService(new LocalStorageRepository(storage),undefined,()=>crypto.randomUUID());service.createProfile({displayName:'Alex',profileType:'independent'});
  const html=renderRecords(service,'measurement','','');
  assert.match(html,/<button type="button" class="anatomy-region-choice" data-anatomy-path="Body &gt; Upper limbs" aria-label="Browse Upper limbs">/);
  assert.match(html,/<button type="button" class="quiet anatomy-back" data-anatomy-path="Body" aria-label="Back to Body">/);
  const controller=await readFile(new URL('../src/app/app.ts',import.meta.url),'utf8');
  assert.match(controller,/isBack=element\.classList\.contains\('anatomy-back'\)/);
  assert.match(controller,/isBack&&origin\?panel\?\.querySelector<HTMLElement>\(`\[data-anatomy-path="\$\{origin\}"\]`\)/);
  assert.match(controller,/panel\?\.querySelector<HTMLElement>\('\[data-anatomy-fact\],\.anatomy-region-choice'\)/);
});
