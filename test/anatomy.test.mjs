import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,access } from 'node:fs/promises';
import { anatomyAnchors,anatomyAssetFor,anatomyFamilyAssets,anatomyFamilyFrom,anatomyIllustrations,anatomyIllustrationFor,anatomyModelFamilyIds,anatomyOrientations,anatomyPointForIllustration,anatomyRegionIds,anatomySymbolAnchors,overlayTypes,standaloneAnatomyAnchors } from '../dist/domain/anatomy.js';
import { canonicalFactById } from '../dist/domain/canonical-facts.js';
import { priorityGuidanceIds } from '../dist/domain/measurement-guidance.js';
import { anatomyFamilyFromLocation,renderAnatomyIllustration,standaloneSvgIssue } from '../dist/app/ui/anatomy-illustration.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';

const geometryAnchors=geometry=>geometry.kind==='tool'?[geometry.anchor]:geometry.kind==='circumference'?[geometry.centre,...geometry.landmark&&geometry.landmark!==geometry.centre?[geometry.landmark]:[]]:geometry.kind==='curved'?[geometry.start,...geometry.via,geometry.end]:[geometry.start,geometry.end];
const fact=id=>anatomyIllustrationFor(`measurement.${id}`);

test('all 35 guided facts have unique typed geometry whose anchors resolve in the selected symbol',async()=>{
 assert.equal(anatomyIllustrations.length,35);assert.equal(new Set(anatomyIllustrations.map(x=>x.id)).size,35);
 await access(new URL('../src/assets/anatomy-model.svg',import.meta.url));const asset=await readFile(new URL('../src/assets/anatomy-model.svg',import.meta.url),'utf8');
 const signatures=new Set();
 for(const item of anatomyIllustrations){
  assert.ok(anatomyRegionIds.includes(item.region));assert.ok(anatomyOrientations.includes(item.orientation));assert.ok(overlayTypes.includes(item.overlay));assert.equal(item.overlay,item.geometry.kind);assert.ok(canonicalFactById(item.canonicalFactId));assert.equal('assetRef' in item,false);assert.equal('modelFamilyId' in item,false);
  const neutral=anatomyAssetFor(item,'neutral');assert.equal(neutral.familyId,'neutral');assert.equal(neutral.assetRef,'/anatomy-model.svg');assert.match(asset,new RegExp(`id=["']${neutral.symbolId}["']`));const declared=geometryAnchors(item.geometry);assert.deepEqual(item.anchors,declared);for(const anchor of declared){assert.ok(anchor in anatomyAnchors);assert.ok(anatomyPointForIllustration(item,anchor),`${item.id}: ${neutral.assetId}.${anchor}`);}
  const signature=`${neutral.symbolId}:${JSON.stringify(item.geometry)}`;assert.ok(!signatures.has(signature),`${item.id} reused generic geometry`);signatures.add(signature);
 }
 assert.deepEqual(new Set(anatomyIllustrations.map(x=>x.canonicalFactId)),new Set(priorityGuidanceIds));
});

test('permanent family asset registry contains safe unique masculine and feminine v1 assets',async()=>{
 assert.deepEqual(anatomyModelFamilyIds,['neutral','masculine','feminine']);assert.equal(new Set(anatomyFamilyAssets.map(x=>x.assetId)).size,anatomyFamilyAssets.length);
 const feminine=[['body-back.svg','0 0 171 586.33'],['body-front.svg','0 0 169 589.18'],['body-side.svg','0 0 96 587'],['head-front.svg','0 0 445 581'],['head-side.svg','0 0 397 580']];
 for(const [name,viewBox] of feminine){const source=await readFile(new URL(`../src/assets/anatomy/feminine/${name}`,import.meta.url),'utf8'),registered=anatomyFamilyAssets.find(x=>x.assetRef===`/anatomy/feminine/${name}`);assert.ok(registered);assert.equal(registered.familyId,'feminine');assert.equal(registered.assetVersion,'v1');assert.equal(registered.viewBox,viewBox);assert.match(source,new RegExp(`viewBox="${viewBox}"`));assert.match(source,/currentColor/);assert.doesNotMatch(source,/<script\b|<image\b|<use\b|(?:href|src)=["']https?:/);}
});

test('representative facts resolve family assets at render time with safe fallback',async()=>{
 const expected=[
  ['height','masculine','masculine-body-side','data-guide-x="4" d="M30.5 1.5 H4 V334 H30.5"'],
  ['waist-circumference','masculine','masculine-body-front','cx="63.6" cy="143"'],
  ['shoulder-width','masculine','masculine-body-back','d="M18 67 L112.5 67"'],
  ['height','feminine','feminine-body-side','data-guide-x="92" d="M48.3 1 H92 V586 H48"'],
  ['waist-circumference','feminine','feminine-body-front','cx="84.5" cy="218"'],
  ['shoulder-width','feminine','feminine-body-back','d="M21 124 L150 124"']
 ];
 for(const [id,family,assetId,path] of expected){const item=fact(id),asset=anatomyAssetFor(item,family),html=renderAnatomyIllustration(`measurement.${id}`,family);assert.equal(asset.assetId,assetId);assert.match(html,new RegExp(path));assert.match(html,/class="anatomy-overlay" hidden/);assert.doesNotMatch(html,/<use\b/);assert.match(html,/role="img"/);assert.match(html,/<title[^>]*>/);assert.match(html,/<desc[^>]*>/);}
 assert.equal(anatomyAssetFor(fact('foot-length'),'feminine').familyId,'neutral');assert.equal(anatomyAssetFor(fact('height'),'unknown').familyId,'neutral');assert.equal(anatomyFamilyFrom('other'),'neutral');assert.equal(anatomyFamilyFromLocation({hostname:'example.com',search:'?anatomyFamily=feminine'}),'neutral');assert.equal(anatomyFamilyFromLocation({hostname:'localhost',search:'?anatomyFamily=feminine'}),'feminine');assert.equal(renderAnatomyIllustration('custom.waist','feminine'),'');
});

test('unrelated facts retain the prototype and illustration data never enters persistence',()=>{
 const unrelated=fact('foot-length');assert.equal(anatomyAssetFor(unrelated,'feminine').familyId,'neutral');assert.match(renderAnatomyIllustration('measurement.foot-length','feminine'),/<use class="anatomy-model" href="\/anatomy-model\.svg#foot-top"\/>/);assert.equal(renderAnatomyIllustration('custom.waist'),'');
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};const service=new SigmaService(new LocalStorageRepository(storage));service.createProfile({displayName:'Synthetic person',profileType:'independent'});const persisted=`${[...values.values()].join(' ')} ${JSON.stringify(service.exportBackup())}`;assert.doesNotMatch(persisted,/masculine|feminine|anatomy\/(?:masculine|feminine)|familyId|assetId|assetRef|standaloneAsset/);assert.equal(service.exportBackup().schemaVersion,4);
});

test('standalone hydration validation rejects misleading or unsafe inputs before overlays reveal',()=>{assert.equal(standaloneSvgIssue('<svg viewBox="0 0 10 10"><path id="line" d="M0 0L1 1"/></svg>','0 0 10 10'),undefined);assert.equal(standaloneSvgIssue('<svg viewBox="0 0 9 9"><path/></svg>','0 0 10 10'),'unexpected viewBox');assert.equal(standaloneSvgIssue('<svg viewBox="0 0 10 10"><title>Empty</title></svg>','0 0 10 10'),'empty SVG');assert.equal(standaloneSvgIssue('<svg viewBox="0 0 10 10"><script/><path/></svg>','0 0 10 10'),'unsafe external SVG content');assert.equal(standaloneSvgIssue('<svg viewBox="0 0 10 10"><image href="https://example.test/a.png"/></svg>','0 0 10 10'),'unsafe external SVG content');const sourceText=readFile(new URL('../src/app/ui/anatomy-illustration.ts',import.meta.url),'utf8');return sourceText.then(source=>{assert.match(source,/sigma-anatomy-\$\{\+\+standaloneInstance\}-/);assert.match(source,/overlay\?\.removeAttribute\('hidden'\)/);assert.match(source,/overlay\?\.setAttribute\('hidden',''\)/);});});

test('point, curved and circumference definitions use fact-specific declared anchors',()=>{
 assert.deepEqual(fact('shoulder-width').geometry,{kind:'point-to-point',start:'shoulderLeft',end:'shoulderRight'});
 assert.deepEqual(fact('hand-length').geometry,{kind:'point-to-point',start:'palmBase',end:'fingertip'});
 assert.deepEqual(fact('inseam').geometry,{kind:'vertical',start:'crotch',end:'floor'});
 assert.deepEqual(fact('foot-length').geometry,{kind:'point-to-point',start:'heel',end:'longestToe'});
 assert.deepEqual(fact('foot-width').geometry,{kind:'point-to-point',start:'ballInner',end:'ballOuter'});
 assert.deepEqual(fact('arch-length').geometry,{kind:'point-to-point',start:'heel',end:'ballInner'});
 assert.deepEqual(fact('sleeve-length').geometry,{kind:'curved',start:'neckBack',via:['shoulderRight','elbow'],end:'wristCrease',direction:true});
 assert.deepEqual(fact('rise').geometry,{kind:'curved',start:'naturalWaistFront',via:['crotch'],end:'naturalWaistBack',direction:true});
 assert.deepEqual(fact('finger-circumference').geometry,{kind:'circumference',centre:'knuckleBase',hiddenRear:true,landmark:'knuckleBase'});
 assert.deepEqual(fact('instep-circumference').geometry,{kind:'circumference',centre:'instepLoopCentre',hiddenRear:true,landmark:'instep'});
});

test('rendered paths expose the anchors and only the legend used by that overlay',()=>{
 const shoulder=renderAnatomyIllustration('measurement.shoulder-width');assert.match(shoulder,/data-start-anchor="shoulderLeft" data-end-anchor="shoulderRight"/);assert.match(shoulder,/Solid path with distinct start and end/);assert.doesNotMatch(shoulder,/Closed circumference|Direction/);
 const sleeve=renderAnatomyIllustration('measurement.sleeve-length');assert.match(sleeve,/data-via-anchors="shoulderRight elbow"/);assert.match(sleeve,/>Direction</);assert.doesNotMatch(sleeve,/Closed circumference/);
 const finger=renderAnatomyIllustration('measurement.finger-circumference');assert.match(finger,/data-anchor="knuckleBase"/);assert.match(finger,/Closed circumference/);assert.doesNotMatch(finger,/distinct start and end|Direction/);
 const weight=renderAnatomyIllustration('measurement.weight');assert.match(weight,/anatomy-scale/);assert.doesNotMatch(weight,/anatomy-key/);
});

test('focused diagrams render distinct coordinates that align with their named landmarks',()=>{
 const cases=[['hand-length','palmBase','fingertip'],['inseam','crotch','floor'],['foot-length','heel','longestToe'],['foot-width','ballInner','ballOuter'],['arch-length','heel','ballInner']];
 for(const [id,start,end] of cases){const html=renderAnatomyIllustration(`measurement.${id}`);assert.match(html,new RegExp(`data-start-anchor="${start}" data-end-anchor="${end}"`));const item=fact(id),symbolId=anatomyAssetFor(item,'neutral').symbolId,a=anatomySymbolAnchors[symbolId][start],b=anatomySymbolAnchors[symbolId][end];assert.match(html,new RegExp(`d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}"`));}
});

test('orientation assets are deliberate drawings rather than transformed front or side copies',async()=>{
 const asset=await readFile(new URL('../src/assets/anatomy-model.svg',import.meta.url),'utf8');
 for(const id of ['body-front','body-back','body-side','head-front','head-side','neck-front','neck-side','torso-front','torso-back','torso-side','upper-limb-front','upper-limb-side','hand-palm','hand-back','hand-side','finger-detail','lower-limb-front','lower-limb-back','lower-limb-side','foot-top','foot-side','foot-sole']){const symbol=asset.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?<\\/symbol>`))?.[0];assert.ok(symbol,id);assert.doesNotMatch(symbol,/transform=|rotate\(|scale\(/,id);if(id!=='scale-front')assert.match(symbol,/<(path|ellipse|g)\b/,id);}
 assert.notEqual(asset.match(/<symbol id="foot-top"[\s\S]*?<\/symbol>/)[0],asset.match(/<symbol id="foot-side"[\s\S]*?<\/symbol>/)[0]);
});

test('resolution remains canonical-only and SVG accessibility stays non-interactive',()=>{assert.equal(anatomyIllustrationFor('Waist circumference'),undefined);assert.equal(anatomyIllustrationFor(undefined),undefined);assert.equal(renderAnatomyIllustration('custom.waist'),'');const html=renderAnatomyIllustration('measurement.foot-length');assert.match(html,/role="img"/);assert.match(html,/tabindex="-1"/);assert.match(html,/<title[^>]*>Foot length/);assert.match(html,/<desc[^>]*>Top foot view/);});
