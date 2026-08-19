import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';
import { renderProfiles } from '../dist/app/ui/profiles.js';
import { renderDashboard } from '../dist/app/ui/dashboard.js';
import { navigationItems } from '../dist/app/content.js';

const storage=()=>{const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)}};
const fixture=()=>{let n=0;const local=storage();const service=new SigmaService(new LocalStorageRepository(local),()=>`2026-08-19T00:00:${String(n).padStart(2,'0')}Z`,()=>`id-${++n}`);const alex=service.createProfile({displayName:'Alex',profileType:'independent'});return{service,alex}};

test('the Home nav item reflects the new dashboard, not a bare profile picker',()=>{
  const home=navigationItems.find((item)=>item.id==='profiles');
  assert.equal(home.label,'Home');
});

test('an editable profile with no records sees quick actions and an honest empty state, not fabricated stats',()=>{
  const{service,alex}=fixture();
  const html=renderDashboard(service,alex,'editable');
  assert.match(html,/data-dashboard-action="record"/);
  assert.match(html,/data-dashboard-action="browse"/);
  assert.match(html,/data-dashboard-action="sizes"/);
  assert.match(html,/data-dashboard-action="history"/);
  assert.match(html,/Nothing recorded yet/);
  // No trend/comparison language anywhere in the dashboard output.
  assert.doesNotMatch(html,/vs last week|trend|this week/i);
});

test('recent records are sorted most-recent-first, capped at five, and show the same value/unit split as record cards',()=>{
  const{service,alex}=fixture();
  for(let i=1;i<=6;i++){
    service.addMeasurement({profileId:alex.id,measurementType:`Metric ${i}`,category:'Upper body',label:`Metric ${i}`,value:i*10,unit:'cm',originalValue:i*10,originalUnit:'cm',measuredAt:`2026-08-${String(i).padStart(2,'0')}`,recordedAt:`2026-08-${String(i).padStart(2,'0')}`,sourceType:'manual',acquisitionMethod:'manual'});
  }
  const html=renderDashboard(service,alex,'editable');
  const items=[...html.matchAll(/<li><span>(Metric \d)<\/span>/g)].map((m)=>m[1]);
  assert.equal(items.length,5,'only the 5 most recent records are shown');
  assert.deepEqual(items,['Metric 6','Metric 5','Metric 4','Metric 3','Metric 2']);
  assert.match(html,/60<span class="record-unit">cm<\/span>/);
});

test('categories are counted across measurements, sizes and brand fits combined',()=>{
  const{service,alex}=fixture();
  service.addMeasurement({profileId:alex.id,measurementType:'Waist',category:'Upper body',label:'Waist',value:90,unit:'cm',originalValue:90,originalUnit:'cm',measuredAt:'2026-08-01',recordedAt:'2026-08-01',sourceType:'manual',acquisitionMethod:'manual'});
  service.addStandardSize({profileId:alex.id,category:'Footwear',label:'Shoe size',sizingSystem:'UK',sizeValue:'9',recordedAt:'2026-08-02',sourceType:'manual'});
  service.addStandardSize({profileId:alex.id,category:'Footwear',label:'Boot size',sizingSystem:'UK',sizeValue:'9',recordedAt:'2026-08-03',sourceType:'manual'});
  const html=renderDashboard(service,alex,'editable');
  assert.match(html,/<li><span>Footwear<\/span><strong>2<\/strong><\/li>/);
  assert.match(html,/<li><span>Upper body<\/span><strong>1<\/strong><\/li>/);
});

test('a read-only shared viewer sees only View records, never a create/record action',()=>{
  const{service,alex}=fixture();
  const html=renderDashboard(service,alex,'read_only');
  assert.doesNotMatch(html,/data-dashboard-action="record"/);
  assert.doesNotMatch(html,/data-dashboard-action="browse"/);
  assert.doesNotMatch(html,/data-dashboard-action="sizes"/);
  assert.match(html,/data-dashboard-action="history">View records/);
});

test('renderProfiles shows the dashboard for the active profile above the People list, but not while creating or editing a profile',()=>{
  const{service,alex}=fixture();
  service.addMeasurement({profileId:alex.id,measurementType:'Waist',category:'Upper body',label:'Waist',value:90,unit:'cm',originalValue:90,originalUnit:'cm',measuredAt:'2026-08-01',recordedAt:'2026-08-01',sourceType:'manual',acquisitionMethod:'manual'});
  const normal=renderProfiles(service);
  assert.match(normal,/class="dashboard"/);
  assert.match(normal,/>Alex</);
  assert.match(normal,/<strong>People<\/strong>/);

  const creating=renderProfiles(service,'',true);
  assert.doesNotMatch(creating,/class="dashboard"/,'the dashboard steps aside while a profile form is open');

  const editing=renderProfiles(service,alex.id,false);
  assert.doesNotMatch(editing,/class="dashboard"/,'the dashboard steps aside while editing a profile');
});
