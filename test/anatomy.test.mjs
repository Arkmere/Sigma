import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,access } from 'node:fs/promises';
import { anatomyAnchors,anatomyIllustrations,anatomyIllustrationFor,anatomyModelFamilyIds,anatomyOrientations,anatomyPointFor,anatomyRegionIds,anatomySymbolAnchors,overlayTypes } from '../dist/domain/anatomy.js';
import { canonicalFactById } from '../dist/domain/canonical-facts.js';
import { priorityGuidanceIds } from '../dist/domain/measurement-guidance.js';
import { renderAnatomyIllustration } from '../dist/app/ui/anatomy-illustration.js';

const geometryAnchors=geometry=>geometry.kind==='tool'?[geometry.anchor]:geometry.kind==='circumference'?[geometry.centre,...geometry.landmark&&geometry.landmark!==geometry.centre?[geometry.landmark]:[]]:geometry.kind==='curved'?[geometry.start,...geometry.via,geometry.end]:[geometry.start,geometry.end];
const fact=id=>anatomyIllustrationFor(`measurement.${id}`);

test('all 35 guided facts have unique typed geometry whose anchors resolve in the selected symbol',async()=>{
 assert.equal(anatomyIllustrations.length,35);assert.equal(new Set(anatomyIllustrations.map(x=>x.id)).size,35);
 await access(new URL('../src/assets/anatomy-model.svg',import.meta.url));const asset=await readFile(new URL('../src/assets/anatomy-model.svg',import.meta.url),'utf8');
 const signatures=new Set();
 for(const item of anatomyIllustrations){
  assert.ok(anatomyModelFamilyIds.includes(item.modelFamilyId));assert.ok(anatomyRegionIds.includes(item.region));assert.ok(anatomyOrientations.includes(item.orientation));assert.ok(overlayTypes.includes(item.overlay));assert.equal(item.overlay,item.geometry.kind);assert.equal(item.assetRef,'/anatomy-model.svg');assert.ok(canonicalFactById(item.canonicalFactId));assert.match(asset,new RegExp(`id=["']${item.symbolId}["']`));
  const declared=geometryAnchors(item.geometry);assert.deepEqual(item.anchors,declared);for(const anchor of declared){assert.ok(anchor in anatomyAnchors);assert.ok(anatomyPointFor(item.symbolId,anchor),`${item.id}: ${item.symbolId}.${anchor}`);}
  const signature=`${item.symbolId}:${JSON.stringify(item.geometry)}`;assert.ok(!signatures.has(signature),`${item.id} reused generic geometry`);signatures.add(signature);
 }
 assert.deepEqual(new Set(anatomyIllustrations.map(x=>x.canonicalFactId)),new Set(priorityGuidanceIds));
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
