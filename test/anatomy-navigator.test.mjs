import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { anatomyChildRegions, anatomyDiscoverableFacts, anatomyPathKey } from '../dist/domain/anatomy-discovery.js';
import { anatomyModelFamilyIds } from '../dist/domain/anatomy.js';
import { anatomyNavigationFamilies, anatomyNavigationRegions, renderAnatomyNavigator } from '../dist/app/ui/anatomy-navigator.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';
import { renderRecords } from '../dist/app/ui/records.js';

const keys=(family)=>anatomyNavigationRegions(family).map(region=>anatomyPathKey(region.path));
const firstLevel=()=>anatomyChildRegions(['Body']).map(anatomyPathKey);

test('visual regions are the existing first-level semantic anatomy paths for every family',()=>{
  assert.deepEqual(anatomyNavigationFamilies,anatomyModelFamilyIds);
  for(const family of anatomyModelFamilyIds){assert.deepEqual(keys(family),firstLevel());for(const region of anatomyNavigationRegions(family)){assert.equal(region.path[0],'Body');assert.equal(region.path.length,2);assert.ok(region.rects.length);assert.ok(region.rects.every(rect=>rect.width>20&&rect.height>40));assert.deepEqual(Object.keys(region).sort(),['label','path','rects']);}}
  assert.equal(anatomyDiscoverableFacts().length,35);
});

test('whole-body navigator changes family assets without changing region semantics',()=>{
  const outputs=anatomyModelFamilyIds.map(family=>renderAnatomyNavigator(family));
  for(const [index,family] of anatomyModelFamilyIds.entries()){const html=outputs[index];assert.match(html,new RegExp(`data-model-family="${family}"`));assert.match(html,new RegExp(`/anatomy/${family}/body-front\\.svg`));assert.match(html,/aria-hidden="true" focusable="false"/);assert.equal((html.match(/data-anatomy-visual-path=/g)??[]).length,4);assert.doesNotMatch(html,/canonicalFactId|measurement\.|tabindex=/);}
  assert.deepEqual(anatomyModelFamilyIds.map(keys),anatomyModelFamilyIds.map(()=>firstLevel()));
});

test('visual and semantic controls coexist and share one navigation action',async()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  const service=new SigmaService(new LocalStorageRepository(storage),undefined,()=>crypto.randomUUID());service.createProfile({displayName:'Alex',profileType:'independent'});
  const html=renderRecords(service,'measurement','','');assert.match(html,/data-anatomy-visual-path="Body &gt; Upper limbs"/);assert.match(html,/<button type="button" class="anatomy-region-choice" data-anatomy-path="Body &gt; Upper limbs"/);assert.match(html,/data-anatomy-fact="measurement.hand-width"/);
  const controller=await readFile(new URL('../src/app/app.ts',import.meta.url),'utf8');assert.match(controller,/const navigateAnatomy=/);assert.match(controller,/bind\(root,'\[data-anatomy-path\]','click',navigateAnatomy\)/);assert.match(controller,/element\.dataset\.anatomyPath=element\.dataset\.anatomyVisualPath;navigateAnatomy\(element\)/);assert.match(controller,/toggleAttribute\('data-selected'/);assert.match(controller,/canonicalPicker\.focus\(\)/);
});

test('visual navigator introduces no persistence and remains inside authorised creation',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};let n=0;
  const service=new SigmaService(new LocalStorageRepository(storage),()=> '2026-08-10T12:00:00Z',()=>`id-${++n}`),owner=service.createProfile({displayName:'Owner',profileType:'independent'}),viewer=service.createProfile({displayName:'Viewer',profileType:'independent'});const request=service.requestConnection(viewer.id);service.selectActor(viewer.id);service.respondConnection(request.id,true);service.selectActor(owner.id);service.grantAccess(owner.id,viewer.id,{type:'profile'});service.selectActor(viewer.id);service.selectProfile(owner.id);
  assert.doesNotMatch(renderRecords(service,'measurement','',''),/anatomy-navigator|anatomy-discovery-browser/);const backup=service.exportBackup();assert.equal(backup.schemaVersion,4);assert.doesNotMatch(JSON.stringify(backup),/anatomyNavigation|visualPath|hoveredRegion|selectedRegion/);assert.ok([...values.keys()].every(key=>!key.toLowerCase().includes('navigator')));
});
