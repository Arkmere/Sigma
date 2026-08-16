import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { anatomyAssetFor, anatomyIllustrationFor, anatomyModelFamilyIds } from '../dist/domain/anatomy.js';
import { canonicalFactDefinitions } from '../dist/domain/canonical-facts.js';
import { SigmaService } from '../dist/domain/service.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { anatomyFamilyFromLocation, renderAnatomyIllustration } from '../dist/app/ui/anatomy-illustration.js';
import { ANATOMY_FAMILY_KEY, readAnatomyFamilyPreference, writeAnatomyFamilyPreference } from '../dist/lib/preferences.js';

const storage=()=>{const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)}};
const local=search=>({hostname:'localhost',search});

test('anatomy presentation preference accepts only the three declared families',()=>{
 for(const [stored,expected] of [[null,'neutral'],['neutral','neutral'],['masculine','masculine'],['feminine','feminine'],['unsupported','neutral']]){const store=storage();if(stored!==null)store.setItem(ANATOMY_FAMILY_KEY,stored);assert.equal(readAnatomyFamilyPreference(store),expected);}
});

test('valid localhost query overrides without mutating storage and invalid queries fall through',()=>{
 const store=storage();writeAnatomyFamilyPreference('feminine',store);
 assert.equal(anatomyFamilyFromLocation(local('?anatomyFamily=masculine'),readAnatomyFamilyPreference(store)),'masculine');
 assert.equal(store.getItem(ANATOMY_FAMILY_KEY),'feminine');
 assert.equal(anatomyFamilyFromLocation(local('?anatomyFamily=foobar'),readAnatomyFamilyPreference(store)),'feminine');
 assert.equal(anatomyFamilyFromLocation({hostname:'example.com',search:'?anatomyFamily=masculine'},readAnatomyFamilyPreference(store)),'feminine');
 assert.equal(store.getItem(ANATOMY_FAMILY_KEY),'feminine');
});

test('stored preference drives representative whole-body, torso, hand and foot guidance',()=>{
 const expected={'measurement.height':'body-side','measurement.bust-circumference':'torso-front','measurement.hand-length':'hand-palm','measurement.foot-width':'foot-top'};
 for(const family of anatomyModelFamilyIds){for(const [factId,view] of Object.entries(expected)){const item=anatomyIllustrationFor(factId),geometry=structuredClone(item.geometry),asset=anatomyAssetFor(item,family),html=renderAnatomyIllustration(factId,family);assert.equal(asset.familyId,family);assert.equal(asset.symbolId,undefined);assert.equal(asset.assetRef,`/anatomy/${family}/${view}.svg`);assert.match(html,new RegExp(`data-standalone-asset="/anatomy/${family}/${view}\\.svg"`));assert.doesNotMatch(html,/<use\b/);assert.deepEqual(item.geometry,geometry);}}
});

test('anatomy preference remains outside profiles, records, repository, backup and sharing',()=>{
 const store=storage(),service=new SigmaService(new LocalStorageRepository(store),()=> '2026-08-10T12:00:00Z',()=>crypto.randomUUID());const profile=service.createProfile({displayName:'Synthetic person',profileType:'independent'});service.addMeasurement({profileId:profile.id,canonicalFactId:'measurement.height',measurementType:'Height',category:'General body dimensions',label:'Height',value:170,unit:'cm',originalValue:170,originalUnit:'cm',measuredAt:'2026-08-10',recordedAt:'2026-08-10T12:00:00Z',sourceType:'manual',acquisitionMethod:'manual'});
 const repositoryBefore=store.getItem('sigma.data.v1'),snapshotBefore=structuredClone(service.snapshot()),backupBefore=JSON.stringify(service.exportBackup()),factsBefore=canonicalFactDefinitions.map(fact=>fact.id);
 writeAnatomyFamilyPreference('masculine',store);
 assert.equal(store.getItem(ANATOMY_FAMILY_KEY),'masculine');assert.equal(store.getItem('sigma.data.v1'),repositoryBefore);assert.deepEqual(service.snapshot(),snapshotBefore);assert.equal(JSON.stringify(service.exportBackup()),backupBefore);assert.deepEqual(canonicalFactDefinitions.map(fact=>fact.id),factsBefore);
 for(const text of [store.getItem('sigma.data.v1'),JSON.stringify(service.exportBackup())])assert.doesNotMatch(text,/anatomyFamily|familyId|assetId|assetRef/);
 assert.equal(service.exportBackup().schemaVersion,5);
});

test('anatomy radio controls inherit the wrapping mobile-safe preference layout',async()=>{const css=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');assert.match(css,/\.theme-options\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*gap:/);assert.match(css,/\.theme-options label\s*\{[^}]*min-height:\s*2\.75rem;[^}]*display:\s*flex;/);});
