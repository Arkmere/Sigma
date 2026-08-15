import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';
import { PermissionDemoService } from '../dist/permissions/service.js';
import { evaluateDemoPayload } from '../dist/sources/import.js';
import { modeLabel, renderRecords } from '../dist/app/ui/records.js';
import { renderProfiles } from '../dist/app/ui/profiles.js';
import { renderFamily } from '../dist/app/ui/family.js';
import { renderSources } from '../dist/app/ui/sources.js';

const storage=()=>{const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)}};
const fixture=()=>{let n=0;const local=storage();const service=new SigmaService(new LocalStorageRepository(local),()=>`2026-07-30T10:00:${String(n).padStart(2,'0')}Z`,()=>`id-${++n}`);const profile=service.createProfile({displayName:'Alex',profileType:'independent'});return{local,service,profile}};
const addMeasurement=(service,profile,value=90)=>service.addMeasurement({profileId:profile.id,measurementType:'Waist',category:'Upper body',label:'Waist',value,unit:'cm',originalValue:value,originalUnit:'cm',measuredAt:'2026-07-29',recordedAt:'2026-07-29T10:00:00Z',sourceType:'manual',acquisitionMethod:'manual'});

test('operational terminology and profile header remain compact and separated',()=>{
  const{service}=fixture();const html=renderProfiles(service);
  assert.equal(modeLabel('brand_fit'),'Brand & product facts');
  assert.match(html,/class="profiles-toolbar"[\s\S]*<strong>People<\/strong><span>1 available<\/span>[\s\S]*class="primary" id="open-profile-form"/);
  assert.match(html,/0 records/);assert.doesNotMatch(html,/0 physical · 0 standard/);
});

test('history entries are coherent blocks and corrected entries retain explicit metadata',()=>{
  const{service,profile}=fixture();const record=addMeasurement(service,profile,90);
  const updated=service.addMeasurementValue(record.id,{value:91,unit:'cm',originalValue:91,originalUnit:'cm',measuredAt:'2026-07-29',recordedAt:'2026-07-29T11:00:00Z',sourceType:'manual',acquisitionMethod:'manual'});
  service.correctMeasurementValue(record.id,updated.values[1].id,'Entered in error');
  const html=renderRecords(service,'measurement','','',false);
  assert.match(html,/class="history-entry corrected-entry"[\s\S]*class="history-entry-main"[\s\S]*91 cm[\s\S]*Incorrect[\s\S]*<dt>Measured<\/dt>[\s\S]*<dt>Recorded<\/dt>[\s\S]*<dt>Marked incorrect<\/dt>[\s\S]*<dt>Reason<\/dt><dd>Entered in error<\/dd>/);
  assert.match(html,/class="history-entry "[\s\S]*90 cm[\s\S]*Current[\s\S]*class="correction-form"/);
});

test('semantic button classes distinguish active actions from genuinely disabled controls',()=>{
  const{service,profile:alex}=fixture();const jordan=service.createProfile({displayName:'Jordan',profileType:'independent'});
  const request=service.requestConnection(jordan.id);service.selectActor(jordan.id);service.respondConnection(request.id,true);service.selectActor(alex.id);
  const overview=renderFamily(service,'full');assert.match(overview,/class="secondary" data-family-view="families"/);assert.doesNotMatch(overview,/data-family-view="families"[^>]*disabled/);
  const composer=renderFamily(service,'full',{ownerId:alex.id,recipientId:jordan.id,scope:'record:measurement',category:'Footwear',recordId:''},'sharing');
  assert.match(composer,/class="primary" disabled>Create explicit grant/);
  assert.match(renderProfiles(service),/class="primary" id="open-profile-form"/);
});

test('Sources prioritise operational choices, disclose policy, and keep future actions truthful',()=>{
  const{service,local}=fixture();const permissions=new PermissionDemoService(local);const html=renderSources(service,permissions);
  assert.ok(html.indexOf('Manual entry')<html.indexOf('How imports are filtered'));
  assert.ok(html.indexOf('Measurement and sizing device demo')<html.indexOf('How imports are filtered'));
  assert.match(html,/<details class="settings-card source-policy"><summary>How imports are filtered<\/summary>/);
  assert.match(html,/Future integrations \(7\)/);
  assert.match(html,/Preview camera permission|Inspect planned scan import|Preview nearby-device permission/);
  assert.doesNotMatch(html,/>Measure with camera<|>Choose scan file<|>Connect measurement device</);
});

test('candidate previews preserve structured provenance and a primary confirmation action',()=>{
  const{service,local}=fixture();const permissions=new PermissionDemoService(local);
  const candidates=evaluateDemoPayload().flatMap(result=>result.status==='accepted'?[result.candidate]:[]);
  const html=renderSources(service,permissions,undefined,candidates,2);
  assert.match(html,/class="candidate-metadata"/);
  for(const label of ['Recorded','Source','Device','Confidence','Method'])assert.match(html,new RegExp(`<dt>${label}<\\/dt>`));
  assert.match(html,/<dd>99%<\/dd>/);assert.match(html,/<dd>Direct<\/dd>/);
  assert.match(html,/class="primary" data-import-candidate="0">Confirm this candidate/);
});

test('Family overview uses one privacy explanation and four focused actions',()=>{
  const{service}=fixture();const html=renderFamily(service,'full');
  assert.equal((html.match(/Joining a Family or connecting with someone shares nothing by itself\./g)||[]).length,1);
  assert.doesNotMatch(html,/Choose one action|actions are separate|EXPLICIT CONSENT/i);
  for(const label of ['Families &amp; members','Managed people','Adult connections','Sharing access'])assert.match(html,new RegExp(label));
});

test('local anatomical line art is used with decorative and meaningful accessibility modes',()=>{
  const emptyService=new SigmaService(new LocalStorageRepository(storage()));
  assert.match(renderProfiles(emptyService),/src="\/body-outline\.svg" alt="" aria-hidden="true"/);
  const{service}=fixture();assert.match(renderRecords(service,'measurement','','',false),/src="\/body-outline\.svg" alt="Abstract body outline"/);
});

test('built styles preserve semantic disabled and reduced-motion behaviour',async()=>{
  const css=await readFile('dist/styles.css','utf8');await access('dist/body-outline.svg');
  assert.match(css,/button:disabled,[\s\S]*cursor: not-allowed/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\)[\s\S]*transition-duration: \.01ms/);
});
