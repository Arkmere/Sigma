import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { anatomyChildRegions, anatomyDiscoverableFacts, anatomyPathKey } from '../dist/domain/anatomy-discovery.js';
import { anatomyModelFamilyIds } from '../dist/domain/anatomy.js';
import { anatomyNavigationFamilies, anatomyNavigationRegions, anatomyNavigationViewFor, renderAnatomyNavigator } from '../dist/app/ui/anatomy-navigator.js';
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
  const outputs=anatomyModelFamilyIds.map(family=>renderAnatomyNavigator(['Body'],family));
  for(const [index,family] of anatomyModelFamilyIds.entries()){const html=outputs[index];assert.match(html,new RegExp(`data-model-family="${family}"`));assert.match(html,new RegExp(`/anatomy/${family}/body-front\\.svg`));assert.match(html,/aria-hidden="true" focusable="false"/);assert.equal((html.match(/data-anatomy-visual-path=/g)??[]).length,4);assert.doesNotMatch(html,/canonicalFactId|measurement\.|tabindex=/);}
  assert.deepEqual(anatomyModelFamilyIds.map(keys),anatomyModelFamilyIds.map(()=>firstLevel()));
});

test('progressive visual views derive from semantic paths for every family',()=>{
  const expected=[
    [['Body'],'body-front',['Body > Head and neck','Body > Torso','Body > Upper limbs','Body > Lower limbs']],
    [['Body','Upper limbs'],'upper-limb-front',['Body > Upper limbs > Hand']],
    [['Body','Upper limbs','Hand'],'hand-palm',['Body > Upper limbs > Hand > Fingers']],
    [['Body','Upper limbs','Hand','Fingers'],'finger-detail',[]],
    [['Body','Lower limbs'],'lower-limb-front',['Body > Lower limbs > Foot']],
    [['Body','Lower limbs','Foot'],'foot-top',[]]
  ];
  for(const family of anatomyModelFamilyIds)for(const [path,assetView,children] of expected){const view=anatomyNavigationViewFor(path,family),html=renderAnatomyNavigator(path,family);assert.equal(view.assetView,assetView);assert.deepEqual(view.regions.map(region=>anatomyPathKey(region.path)),children);assert.match(html,new RegExp(`data-asset-id="${family}-${assetView}"`));assert.match(html,new RegExp(`/anatomy/${family}/${assetView}\\.svg`));assert.equal((html.match(/data-anatomy-visual-path=/g)??[]).length,children.length);}
});

test('detail targets use semantic children, terminal views fabricate none, and metadata contains no fact mappings',async()=>{
  for(const family of anatomyModelFamilyIds){assert.deepEqual(anatomyNavigationViewFor(['Body','Upper limbs'],family).regions.map(region=>region.path),[['Body','Upper limbs','Hand']]);assert.deepEqual(anatomyNavigationViewFor(['Body','Upper limbs','Hand'],family).regions.map(region=>region.path),[['Body','Upper limbs','Hand','Fingers']]);assert.deepEqual(anatomyNavigationViewFor(['Body','Lower limbs'],family).regions.map(region=>region.path),[['Body','Lower limbs','Foot']]);assert.equal(anatomyNavigationViewFor(['Body','Upper limbs','Hand','Fingers'],family).regions.length,0);assert.equal(anatomyNavigationViewFor(['Body','Lower limbs','Foot'],family).regions.length,0);}
  const source=await readFile(new URL('../src/app/ui/anatomy-navigator.ts',import.meta.url),'utf8');assert.doesNotMatch(source,/['"](?:measurement|size|brand)\./);
});

test('visual and semantic controls coexist and share one navigation action',async()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  const service=new SigmaService(new LocalStorageRepository(storage),undefined,()=>crypto.randomUUID());service.createProfile({displayName:'Alex',profileType:'independent'});
  const html=renderRecords(service,'measurement','','');assert.match(html,/data-anatomy-visual-path="Body &gt; Upper limbs"/);assert.match(html,/<button type="button" class="anatomy-region-choice" data-anatomy-path="Body &gt; Upper limbs"/);assert.match(html,/data-anatomy-fact="measurement.hand-width"/);
  const controller=await readFile(new URL('../src/app/app.ts',import.meta.url),'utf8');assert.match(controller,/const navigateAnatomy=/);assert.match(controller,/bind\(root,'\[data-anatomy-path\]','click',navigateAnatomy\)/);assert.match(controller,/element\.dataset\.anatomyPath=element\.dataset\.anatomyVisualPath;navigateAnatomy\(element\)/);assert.match(controller,/renderAnatomyNavigator\(path\.split/);assert.match(controller,/toggleAttribute\('data-selected'/);assert.match(controller,/canonicalPicker\.focus\(\)/);
});

test('deep back navigation has visible semantic opener targets and SVG regions stay unfocusable',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  const service=new SigmaService(new LocalStorageRepository(storage),undefined,()=>crypto.randomUUID());service.createProfile({displayName:'Alex',profileType:'independent'});
  const html=renderRecords(service,'measurement','','');
  for(const [child,parent,opener] of [
    ['Body > Upper limbs > Hand > Fingers','Body > Upper limbs > Hand','Body > Upper limbs > Hand > Fingers'],
    ['Body > Upper limbs > Hand','Body > Upper limbs','Body > Upper limbs > Hand'],
    ['Body > Lower limbs > Foot','Body > Lower limbs','Body > Lower limbs > Foot']
  ]){
    const encoded=value=>value.replaceAll('>','&gt;');
    assert.match(html,new RegExp(`data-anatomy-panel="${encoded(child)}"[\\s\\S]*?<button[^>]+class="quiet anatomy-back"[^>]+data-anatomy-path="${encoded(parent)}"`));
    assert.match(html,new RegExp(`data-anatomy-panel="${encoded(parent)}"[\\s\\S]*?<button[^>]+data-anatomy-path="${encoded(opener)}"`));
  }
  assert.match(renderAnatomyNavigator(['Body','Upper limbs','Hand'],'neutral'),/aria-hidden="true" focusable="false"/);
  assert.doesNotMatch(renderAnatomyNavigator(['Body','Upper limbs','Hand'],'neutral'),/tabindex=/);
});

test('visual navigator introduces no persistence and remains inside authorised creation',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};let n=0;
  const service=new SigmaService(new LocalStorageRepository(storage),()=> '2026-08-10T12:00:00Z',()=>`id-${++n}`),owner=service.createProfile({displayName:'Owner',profileType:'independent'}),viewer=service.createProfile({displayName:'Viewer',profileType:'independent'});const request=service.requestConnection(viewer.id);service.selectActor(viewer.id);service.respondConnection(request.id,true);service.selectActor(owner.id);service.grantAccess(owner.id,viewer.id,{type:'profile'});service.selectActor(viewer.id);service.selectProfile(owner.id);
  assert.doesNotMatch(renderRecords(service,'measurement','',''),/anatomy-navigator|anatomy-discovery-browser/);const backup=service.exportBackup();assert.equal(backup.schemaVersion,7);assert.doesNotMatch(JSON.stringify(backup),/anatomyNavigation|visualPath|hoveredRegion|selectedRegion/);assert.ok([...values.keys()].every(key=>!key.toLowerCase().includes('navigator')));
});
