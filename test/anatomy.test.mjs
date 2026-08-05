import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,access } from 'node:fs/promises';
import { anatomyAnchors,anatomyIllustrations,anatomyIllustrationFor,anatomyModelFamilyIds,anatomyOrientations,anatomyPointForIllustration,anatomyRegionIds,anatomySymbolAnchors,overlayTypes,standaloneAnatomyAnchors } from '../dist/domain/anatomy.js';
import { canonicalFactById } from '../dist/domain/canonical-facts.js';
import { priorityGuidanceIds } from '../dist/domain/measurement-guidance.js';
import { renderAnatomyIllustration } from '../dist/app/ui/anatomy-illustration.js';
import { LocalStorageRepository } from '../dist/data/repository.js';
import { SigmaService } from '../dist/domain/service.js';

const geometryAnchors=geometry=>geometry.kind==='tool'?[geometry.anchor]:geometry.kind==='circumference'?[geometry.centre,...geometry.landmark&&geometry.landmark!==geometry.centre?[geometry.landmark]:[]]:geometry.kind==='curved'?[geometry.start,...geometry.via,geometry.end]:[geometry.start,geometry.end];
const fact=id=>anatomyIllustrationFor(`measurement.${id}`);

test('all 35 guided facts have unique typed geometry whose anchors resolve in the selected symbol',async()=>{
 assert.equal(anatomyIllustrations.length,35);assert.equal(new Set(anatomyIllustrations.map(x=>x.id)).size,35);
 await access(new URL('../src/assets/anatomy-model.svg',import.meta.url));const asset=await readFile(new URL('../src/assets/anatomy-model.svg',import.meta.url),'utf8');
 const signatures=new Set();
 for(const item of anatomyIllustrations){
  assert.ok(anatomyModelFamilyIds.includes(item.modelFamilyId));assert.ok(anatomyRegionIds.includes(item.region));assert.ok(anatomyOrientations.includes(item.orientation));assert.ok(overlayTypes.includes(item.overlay));assert.equal(item.overlay,item.geometry.kind);assert.ok(canonicalFactById(item.canonicalFactId));if(!item.standaloneAssetId){assert.equal(item.assetRef,'/anatomy-model.svg');assert.match(asset,new RegExp(`id=["']${item.symbolId}["']`));}
  const declared=geometryAnchors(item.geometry);assert.deepEqual(item.anchors,declared);for(const anchor of declared){assert.ok(anchor in anatomyAnchors);assert.ok(anatomyPointForIllustration(item,anchor),`${item.id}: ${item.standaloneAssetId??item.symbolId}.${anchor}`);}
  const signature=`${item.symbolId}:${JSON.stringify(item.geometry)}`;assert.ok(!signatures.has(signature),`${item.id} reused generic geometry`);signatures.add(signature);
 }
 assert.deepEqual(new Set(anatomyIllustrations.map(x=>x.canonicalFactId)),new Set(priorityGuidanceIds));
});

test('limited masculine standalone mappings use measured native coordinates and inline placeholders',async()=>{
 const expected=[
  ['height','/anatomy/masculine/body-side.svg','masculine-body-side','0 0 60.96 335.76',['floor','crown'],'data-guide-x="4" d="M30.5 1.5 H4 V334 H30.5"'],
  ['waist-circumference','/anatomy/masculine/body-front.svg','masculine-body-front','0 0 127.2 329.52',['naturalWaist'],'cx="63.6" cy="143"'],
  ['shoulder-width','/anatomy/masculine/body-back.svg','masculine-body-back','0 0 130.56 340.08',['shoulderLeft','shoulderRight'],'d="M18 67 L112.5 67"']
 ];
 for(const [id,assetRef,assetId,viewBox,anchors,path] of expected){const item=fact(id);assert.equal(item.modelFamilyId,'masculine-v1-test');assert.equal(item.assetRef,assetRef);assert.equal(item.standaloneAssetId,assetId);assert.equal(item.viewBox,viewBox);for(const anchor of anchors)assert.ok(standaloneAnatomyAnchors[assetId][anchor]);const source=await readFile(new URL(`../src/assets${assetRef}`,import.meta.url),'utf8');assert.match(source,new RegExp(`viewBox="${viewBox}"`));assert.doesNotMatch(source,/<use\b|<script\b|<image\b|(?:href|src)=["']https?:/);const html=renderAnatomyIllustration(`measurement.${id}`);assert.match(html,new RegExp(`data-standalone-asset="${assetRef.replaceAll('/','\\/')}"`));assert.match(html,new RegExp(path));assert.match(html,/class="anatomy-overlay" hidden/);assert.doesNotMatch(html,/<use\b/);assert.match(html,/role="img"/);assert.match(html,/<title[^>]*>/);assert.match(html,/<desc[^>]*>/);}
 assert.equal(fact('height').standaloneGuideX,4);assert.deepEqual(standaloneAnatomyAnchors['masculine-body-back'],{shoulderLeft:[18,67],shoulderRight:[112.5,67]});assert.deepEqual(standaloneAnatomyAnchors['masculine-body-front'].naturalWaist,[63.6,143]);
});

test('unrelated facts retain the prototype and illustration data never enters persistence',()=>{
 const unrelated=fact('foot-length');assert.equal(unrelated.modelFamilyId,'sigma-neutral-v1');assert.equal(unrelated.assetRef,'/anatomy-model.svg');assert.equal(unrelated.standaloneAssetId,undefined);assert.match(renderAnatomyIllustration('measurement.foot-length'),/<use class="anatomy-model" href="\/anatomy-model\.svg#foot-top"\/>/);assert.equal(renderAnatomyIllustration('custom.waist'),'');
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};const service=new SigmaService(new LocalStorageRepository(storage));service.createProfile({displayName:'Synthetic person',profileType:'independent'});const persisted=`${[...values.values()].join(' ')} ${JSON.stringify(service.exportBackup())}`;assert.doesNotMatch(persisted,/masculine|anatomy\/masculine|modelFamily|assetRef|standaloneAsset/);
});

test('point, curved and circumference definitions use fact-specific declared anchors',()=>{
 assert.deepEqual(fact('shoulder-width').geometry,{kind:'point-to-point',start:'shoulderLeft',end:'shoulderRight'});
 assert.deepEqual(fact('hand-length').geometry,{kind:'point-to-point',start:'palmBase',end:'fingertip'});
 assert.deepEqual(fact('inseam').geometry,{kind:'vertical',start:'crotch',end:'floor'});
 assert.deepEqual(fact('foot-length').geometry,{kind:'point-to-point',start:'heel',end:'longestToe'});
 assert.deepEqual(fact('foot-width').geometry,{kind:'point-to-point',start:'ballInner',end:'ballOuter'});
 assert.deepEqual(fact('arch-length').geometry,{kind:'point-to-point',start:'heel',end:'ballInner'});
 assert.deepEqual(fact('sleeve-length').geometry,{kind:'curved',start:'neckBack',via:['shoulderRight','elbow'],end:'wristCrease',direction:true});
 assert.deepEqual(fact('rise').geometry,{kind:'curved',start:'naturalWaistFront',via:['crotch'],end:'naturalWaistBack',direction:true});
 assert.deepEqual(fact('finger-circumference').geometry,{kind:'circumference',centre:'knuckleBase',radiusX:27,radiusY:8,hiddenRear:true,landmark:'knuckleBase'});
 assert.deepEqual(fact('instep-circumference').geometry,{kind:'circumference',centre:'instepLoopCentre',radiusX:31,radiusY:42,hiddenRear:true,landmark:'instep'});
});

test('rendered paths expose the anchors and only the legend used by that overlay',()=>{
 const shoulder=renderAnatomyIllustration('measurement.shoulder-width');assert.match(shoulder,/data-start-anchor="shoulderLeft" data-end-anchor="shoulderRight"/);assert.match(shoulder,/Solid path with distinct start and end/);assert.doesNotMatch(shoulder,/Closed circumference|Direction/);
 const sleeve=renderAnatomyIllustration('measurement.sleeve-length');assert.match(sleeve,/data-via-anchors="shoulderRight elbow"/);assert.match(sleeve,/>Direction</);assert.doesNotMatch(sleeve,/Closed circumference/);
 const finger=renderAnatomyIllustration('measurement.finger-circumference');assert.match(finger,/data-anchor="knuckleBase"/);assert.match(finger,/Closed circumference/);assert.doesNotMatch(finger,/distinct start and end|Direction/);
 const weight=renderAnatomyIllustration('measurement.weight');assert.match(weight,/anatomy-scale/);assert.doesNotMatch(weight,/anatomy-key/);
});

test('focused diagrams render distinct coordinates that align with their named landmarks',()=>{
 const cases=[['hand-length','palmBase','fingertip'],['inseam','crotch','floor'],['foot-length','heel','longestToe'],['foot-width','ballInner','ballOuter'],['arch-length','heel','ballInner']];
 for(const [id,start,end] of cases){const html=renderAnatomyIllustration(`measurement.${id}`);assert.match(html,new RegExp(`data-start-anchor="${start}" data-end-anchor="${end}"`));const item=fact(id);const a=anatomySymbolAnchors[item.symbolId][start],b=anatomySymbolAnchors[item.symbolId][end];assert.match(html,new RegExp(`d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}"`));}
});

test('orientation assets are deliberate drawings rather than transformed front or side copies',async()=>{
 const asset=await readFile(new URL('../src/assets/anatomy-model.svg',import.meta.url),'utf8');
 for(const id of ['body-front','body-back','body-side','head-front','head-side','neck-front','neck-side','torso-front','torso-back','torso-side','upper-limb-front','upper-limb-side','hand-palm','hand-back','hand-side','finger-detail','lower-limb-front','lower-limb-back','lower-limb-side','foot-top','foot-side','foot-sole']){const symbol=asset.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?<\\/symbol>`))?.[0];assert.ok(symbol,id);assert.doesNotMatch(symbol,/transform=|rotate\(|scale\(/,id);if(id!=='scale-front')assert.match(symbol,/<(path|ellipse|g)\b/,id);}
 assert.notEqual(asset.match(/<symbol id="foot-top"[\s\S]*?<\/symbol>/)[0],asset.match(/<symbol id="foot-side"[\s\S]*?<\/symbol>/)[0]);
});

test('resolution remains canonical-only and SVG accessibility stays non-interactive',()=>{assert.equal(anatomyIllustrationFor('Waist circumference'),undefined);assert.equal(anatomyIllustrationFor(undefined),undefined);assert.equal(renderAnatomyIllustration('custom.waist'),'');const html=renderAnatomyIllustration('measurement.foot-length');assert.match(html,/role="img"/);assert.match(html,/tabindex="-1"/);assert.match(html,/<title[^>]*>Foot length/);assert.match(html,/<desc[^>]*>Top foot view/);});
