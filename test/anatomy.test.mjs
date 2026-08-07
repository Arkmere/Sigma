import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,access } from 'node:fs/promises';
import { anatomyAnchors,anatomyAssetFor,anatomyFamilyAssets,anatomyFamilyFrom,anatomyIllustrations,anatomyIllustrationFor,anatomyModelFamilyIds,anatomyOrientations,anatomyPointForIllustration,anatomyRegionIds,anatomySymbolAnchors,overlayTypes,standaloneAnatomyAnchors,standaloneAnatomyAssetIds,standaloneAnatomyViewIds } from '../dist/domain/anatomy.js';
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
  const neutral=anatomyAssetFor(item,'neutral');assert.equal(neutral.familyId,'neutral');if(neutral.symbolId){assert.equal(neutral.assetRef,'/anatomy-model.svg');assert.match(asset,new RegExp(`id=["']${neutral.symbolId}["']`));}else assert.match(neutral.assetRef,/^\/anatomy\/neutral\//);const declared=geometryAnchors(item.geometry);assert.deepEqual(item.anchors,declared);for(const anchor of declared){assert.ok(anchor in anatomyAnchors);assert.ok(anatomyPointForIllustration(item,anchor),`${item.id}: ${neutral.assetId}.${anchor}`);}
  const signature=`${neutral.assetId}:${JSON.stringify(item.geometry)}`;assert.ok(!signatures.has(signature),`${item.id} reused generic geometry`);signatures.add(signature);
 }
 assert.deepEqual(new Set(anatomyIllustrations.map(x=>x.canonicalFactId)),new Set(priorityGuidanceIds));
});

test('permanent family asset registry contains the safe typed regional vocabulary',async()=>{
 assert.deepEqual(anatomyModelFamilyIds,['neutral','masculine','feminine']);assert.equal(anatomyFamilyAssets.length,66);assert.deepEqual(anatomyFamilyAssets.map(x=>x.assetId),standaloneAnatomyAssetIds);assert.equal(new Set(standaloneAnatomyAssetIds).size,66);
 const native={neutral:{'body-front':'0 0 116.88 280.08','body-back':'0 0 116.88 279.6','body-side':'0 0 46.56 279.84'},masculine:{'body-front':'0 0 127.2 329.52','body-back':'0 0 130.56 340.08','body-side':'0 0 60.96 335.76'},feminine:{'body-front':'0 0 169 589.18','body-back':'0 0 171 586.33','body-side':'0 0 96 587','head-front':'0 0 445 581','head-side':'0 0 397 580'}};
 for(const family of anatomyModelFamilyIds)for(const view of standaloneAnatomyViewIds){const name=`${view}.svg`,viewBox=native[family]?.[view]??'0 0 1000 1000',source=await readFile(new URL(`../src/assets/anatomy/${family}/${name}`,import.meta.url),'utf8'),registered=anatomyFamilyAssets.find(x=>x.assetRef===`/anatomy/${family}/${name}`);assert.ok(registered);assert.equal(registered.assetId,`${family}-${view}`);assert.equal(registered.familyId,family);assert.equal(registered.assetVersion,'v1');assert.equal(registered.viewBox,viewBox);assert.match(source,new RegExp(`viewBox="${viewBox}"`));assert.match(source,/currentColor/);assert.match(source,/<title\b[^>]*>[^<]+<\/title>/);assert.match(source,/<desc\b[^>]*>[^<]+<\/desc>/);assert.doesNotMatch(source,/<script\b|<image\b|<use\b|(?:href|src)=["'](?:https?:|\/\/)/);}
});

test('representative facts resolve family assets at render time with safe fallback',async()=>{
 const expected=[
  ['height','neutral','neutral-body-side','data-guide-x="1.5" d="M25.75 0.59 H1.5 V279.2 H28"'],
  ['waist-circumference','neutral','neutral-body-front','cx="58.44" cy="104"'],
  ['shoulder-width','neutral','neutral-body-back','d="M26 58 L91 58"'],
  ['height','masculine','masculine-body-side','data-guide-x="4" d="M30.5 1.5 H4 V334 H30.5"'],
  ['waist-circumference','masculine','masculine-body-front','cx="63.6" cy="143"'],
  ['shoulder-width','masculine','masculine-body-back','d="M18 67 L112.5 67"'],
  ['height','feminine','feminine-body-side','data-guide-x="92" d="M48.3 1 H92 V586 H48"'],
  ['waist-circumference','feminine','feminine-body-front','cx="84.5" cy="218"'],
  ['shoulder-width','feminine','feminine-body-back','d="M21 124 L150 124"']
 ];
 for(const [id,family,assetId,path] of expected){const item=fact(id),asset=anatomyAssetFor(item,family),html=renderAnatomyIllustration(`measurement.${id}`,family);assert.equal(asset.assetId,assetId);assert.match(html,new RegExp(path));assert.match(html,/class="anatomy-overlay" hidden/);assert.doesNotMatch(html,/<use\b/);assert.match(html,/role="img"/);assert.match(html,/<title[^>]*>/);assert.match(html,/<desc[^>]*>/);}
 assert.equal(anatomyAssetFor(fact('foot-length'),'feminine').assetId,'feminine-foot-top');assert.equal(anatomyAssetFor(fact('height'),'unknown').familyId,'neutral');assert.equal(anatomyFamilyFrom('other'),'neutral');assert.equal(anatomyFamilyFromLocation({hostname:'example.com',search:'?anatomyFamily=feminine'}),'neutral');assert.equal(anatomyFamilyFromLocation({hostname:'localhost',search:'?anatomyFamily=feminine'}),'feminine');assert.equal(renderAnatomyIllustration('custom.waist','feminine'),'');
});

test('second-tranche facts resolve reusable regional geometry for every family',()=>{
 const mapped={'head-circumference':'head-side','neck-circumference':'neck-front','chest-circumference':'torso-front','bust-circumference':'torso-front','underbust-circumference':'torso-front','hip-circumference':'torso-front','sleeve-length':'upper-limb-side','inseam':'lower-limb-front','rise':'torso-side'};
 for(const family of anatomyModelFamilyIds)for(const [id,view] of Object.entries(mapped)){const item=fact(id),asset=anatomyAssetFor(item,family),html=renderAnatomyIllustration(`measurement.${id}`,family);assert.equal(asset.assetId,`${family}-${view}`);assert.equal(asset.symbolId,undefined);assert.match(asset.assetRef,new RegExp(`/anatomy/${family}/${view}\\.svg`));for(const anchor of item.anchors)assert.ok(asset.anchors[anchor],`${asset.assetId}.${anchor}`);if(item.geometry.kind==='circumference')assert.ok(asset.circumferences?.[item.geometry.centre]);assert.match(html,/class="anatomy-overlay" hidden/);assert.doesNotMatch(html,/<use\b/);assert.match(html,/<title[^>]*>/);assert.match(html,/<desc[^>]*>/);}
 assert.equal(anatomyAssetFor(fact('head-circumference'),'unknown').assetId,'neutral-head-side');assert.equal(renderAnatomyIllustration('custom.head','neutral'),'');
});

test('regional anchors and radii retain their measured family coordinates',()=>{
 const expected={
  neutral:{head:[[545,299],220,190],neck:[[500,492],196,75],torso:[[500,285],[500,354],[500,417],[500,700]],sleeve:[[630,95],[661,123],[615,483],[484,680]],inseam:[[500,95],[500,834]],rise:[[596,468],[520,757],[463,468]]},
  masculine:{head:[[520,322],210,205],neck:[[500,500],200,70],torso:[[500,337],[500,401],[500,471],[500,738]],sleeve:[[620,90],[653,112],[632,440],[539,713]],inseam:[[500,52],[500,831]],rise:[[595,563],[522,783],[448,563]]},
  feminine:{head:[[220,190],170,120],neck:[[500,500],187,65],torso:[[500,247],[500,306],[500,366],[500,720]],sleeve:[[625,115],[663,136],[626,495],[532,761]],inseam:[[500,9],[500,787]],rise:[[599,467],[539,713],[494,467]]}
 };
 for(const family of anatomyModelFamilyIds){const e=expected[family],head=anatomyAssetFor(fact('head-circumference'),family),neck=anatomyAssetFor(fact('neck-circumference'),family),torsoFacts=['chest-circumference','bust-circumference','underbust-circumference','hip-circumference'].map(id=>anatomyAssetFor(fact(id),family)),sleeve=anatomyAssetFor(fact('sleeve-length'),family),inseam=anatomyAssetFor(fact('inseam'),family),rise=anatomyAssetFor(fact('rise'),family);assert.deepEqual([head.anchors.headWidest,head.circumferences.headWidest.radiusX,head.circumferences.headWidest.radiusY],e.head);assert.deepEqual([neck.anchors.neckBase,neck.circumferences.neckBase.radiusX,neck.circumferences.neckBase.radiusY],e.neck);assert.deepEqual(torsoFacts.map((asset,index)=>asset.anchors[['chestLevel','bustLevel','underbustLine','fullHip'][index]]),e.torso);assert.deepEqual(['neckBack','shoulderRight','elbow','wristCrease'].map(anchor=>sleeve.anchors[anchor]),e.sleeve);assert.deepEqual([inseam.anchors.crotch,inseam.anchors.ankle],e.inseam);assert.deepEqual(['naturalWaistFront','crotch','naturalWaistBack'].map(anchor=>rise.anchors[anchor]),e.rise);}
});

test('third-tranche facts resolve the existing regional vocabulary for all 42 family combinations',()=>{
 const mapped={'back-width':'torso-back','torso-length':'torso-side','arm-length':'upper-limb-front','upper-arm-circumference':'upper-limb-front','forearm-circumference':'upper-limb-front','outseam':'lower-limb-side','front-rise':'lower-limb-front','back-rise':'lower-limb-back','thigh-circumference':'lower-limb-front','knee-circumference':'lower-limb-front','calf-circumference':'lower-limb-back','ankle-circumference':'ankle-detail','arch-length':'foot-side','instep-circumference':'foot-side'};
 for(const family of anatomyModelFamilyIds)for(const [id,view] of Object.entries(mapped)){const item=fact(id),asset=anatomyAssetFor(item,family),html=renderAnatomyIllustration(`measurement.${id}`,family);assert.equal(asset.assetId,`${family}-${view}`);assert.equal(asset.symbolId,undefined);assert.equal(asset.assetRef,`/anatomy/${family}/${view}.svg`);for(const anchor of item.anchors)assert.ok(asset.anchors[anchor],`${asset.assetId}.${anchor}`);if(item.geometry.kind==='circumference')assert.ok(asset.circumferences?.[item.geometry.centre],`${asset.assetId}.${item.geometry.centre} radii`);assert.match(html,/class="anatomy-overlay" hidden/);assert.doesNotMatch(html,/<use\b/);assert.match(html,new RegExp(`data-standalone-asset="/anatomy/${family}/${view}\\.svg"`));}
});

test('third-tranche family geometry records exact measured anchors and radii',()=>{
 const expected={
  neutral:{back:[[390,326],[610,326]],torso:[[468,80],[530,468]],arm:[[690,185],[746,470],[778,735],[716,310],[758,575]],lower:[[500,4],[500,95],[514,855],[405,190],[401,438],[603,590],[500,646]],foot:[[940,742],[290,760],[620,470],[620,665],[620,786]],radii:[[58,20],[48,17],[106,30],[74,23],[75,24],[185,55],[145,180]]},
  masculine:{back:[[365,327],[635,327]],torso:[[465,67],[522,563]],arm:[[714,170],[765,438],[803,724],[737,293],[782,552]],lower:[[500,4],[500,52],[515,862],[394,164],[397,435],[607,580],[500,640]],foot:[[944,735],[278,761],[620,455],[620,658],[620,784]],radii:[[64,22],[52,18],[116,32],[82,24],[82,26],[190,58],[150,185]]},
  feminine:{back:[[398,310],[602,310]],torso:[[480,84],[545,467]],arm:[[682,164],[733,474],[772,758],[706,300],[751,595]],lower:[[500,4],[500,9],[520,850],[407,118],[408,421],[594,574],[500,650]],foot:[[940,748],[286,770],[615,465],[615,670],[615,794]],radii:[[52,18],[44,16],[105,30],[72,22],[70,23],[178,52],[142,180]]}
 };
 for(const family of anatomyModelFamilyIds){const e=expected[family],back=anatomyAssetFor(fact('back-width'),family),torso=anatomyAssetFor(fact('torso-length'),family),arm=anatomyAssetFor(fact('arm-length'),family),front=anatomyAssetFor(fact('thigh-circumference'),family),side=anatomyAssetFor(fact('outseam'),family),rear=anatomyAssetFor(fact('calf-circumference'),family),ankle=anatomyAssetFor(fact('ankle-circumference'),family),foot=anatomyAssetFor(fact('instep-circumference'),family);assert.deepEqual(['backLeft','backRight'].map(x=>back.anchors[x]),e.back);assert.deepEqual(['neckBack','naturalWaist'].map(x=>torso.anchors[x]),e.torso);assert.deepEqual(['shoulderRight','elbow','wristCrease','upperArmFull','forearmFull'].map(x=>arm.anchors[x]),e.arm);assert.deepEqual([front.anchors.naturalWaist,front.anchors.crotch,side.anchors.floor,front.anchors.thighFull,front.anchors.kneeCentre,rear.anchors.calfFull,ankle.anchors.ankle],e.lower);assert.deepEqual(['heel','ballInner','instep','instepLoopCentre','soleBelowInstep'].map(x=>foot.anchors[x]),e.foot);assert.deepEqual([[arm.circumferences.upperArmFull.radiusX,arm.circumferences.upperArmFull.radiusY],[arm.circumferences.forearmFull.radiusX,arm.circumferences.forearmFull.radiusY],[front.circumferences.thighFull.radiusX,front.circumferences.thighFull.radiusY],[front.circumferences.kneeCentre.radiusX,front.circumferences.kneeCentre.radiusY],[rear.circumferences.calfFull.radiusX,rear.circumferences.calfFull.radiusY],[ankle.circumferences.ankle.radiusX,ankle.circumferences.ankle.radiusY],[foot.circumferences.instepLoopCentre.radiusX,foot.circumferences.instepLoopCentre.radiusY]],e.radii);}
});

test('final nine facts complete standalone coverage without leaking illustration data into persistence',()=>{
 const mapped={'weight':'scale-front','wrist-circumference':'hand-palm','hand-length':'hand-palm','hand-width':'hand-palm','palm-circumference':'hand-palm','finger-circumference':'finger-detail','foot-length':'foot-top','foot-width':'foot-top','foot-circumference':'foot-top'};for(const [id,view] of Object.entries(mapped))for(const family of anatomyModelFamilyIds){const item=fact(id),asset=anatomyAssetFor(item,family),html=renderAnatomyIllustration(`measurement.${id}`,family);assert.equal(asset.assetId,`${family}-${view}`);assert.equal(asset.familyId,family);assert.equal(asset.assetRef,`/anatomy/${family}/${view}.svg`);assert.equal(asset.symbolId,undefined);for(const anchor of item.anchors)assert.ok(asset.anchors[anchor],`${asset.assetId}.${anchor}`);if(item.geometry.kind==='circumference')assert.ok(asset.circumferences?.[item.geometry.centre]);assert.match(html,/class="anatomy-figure anatomy-figure-standalone"/);assert.match(html,/class="anatomy-overlay" hidden/);assert.doesNotMatch(html,/<use\b/);}
 const expected={neutral:{hand:[[500,812.7],[500,812.7],[523.1,104.3],[369.1,562.45],[642.45,562.45],[503.85,562.45]],finger:[500,616.35],foot:[[500,831.95],[500,131.25],[396.05,354.55],[646.3,385.35],[523.1,369.95]],radii:[[65.45,23.1],[138.6,38.5],[103.95,30.8],[130.9,46.2]]},masculine:{hand:[[500,812.7],[500,812.7],[523.793,104.3],[365.173,562.45],[646.7235,562.45],[503.9655,562.45]],finger:[500,616.35],foot:[[500,831.95],[500,131.25],[392.9315,354.55],[650.689,385.35],[523.793,369.95]],radii:[[67.4135,23.1],[142.758,38.5],[107.0685,30.8],[134.827,46.2]]},feminine:{hand:[[500,812.7],[500,812.7],[522.407,104.3],[373.071,562.45],[638.1765,562.45],[503.7345,562.45]],finger:[500,616.35],foot:[[500,831.95],[500,131.25],[399.1685,354.55],[641.911,385.35],[522.407,369.95]],radii:[[63.4865,23.1],[134.442,38.5],[100.8315,30.8],[126.973,46.2]]}};for(const family of anatomyModelFamilyIds){const e=expected[family],hand=anatomyAssetFor(fact('hand-length'),family),finger=anatomyAssetFor(fact('finger-circumference'),family),foot=anatomyAssetFor(fact('foot-length'),family);assert.deepEqual(['wristCrease','palmBase','fingertip','palmLeft','palmRight','palmCentre'].map(x=>hand.anchors[x]),e.hand);assert.deepEqual(finger.anchors.knuckleBase,e.finger);assert.deepEqual(['heel','longestToe','ballInner','ballOuter','ballCentre'].map(x=>foot.anchors[x]),e.foot);assert.deepEqual([[hand.circumferences.wristCrease.radiusX,hand.circumferences.wristCrease.radiusY],[hand.circumferences.palmCentre.radiusX,hand.circumferences.palmCentre.radiusY],[finger.circumferences.knuckleBase.radiusX,finger.circumferences.knuckleBase.radiusY],[foot.circumferences.ballCentre.radiusX,foot.circumferences.ballCentre.radiusY]],e.radii);assert.deepEqual(anatomyAssetFor(fact('weight'),family).anchors.scale,[500,892]);}
 assert.equal(renderAnatomyIllustration('custom.waist'),'');
 const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};const service=new SigmaService(new LocalStorageRepository(storage));service.createProfile({displayName:'Synthetic person',profileType:'independent'});const persisted=`${[...values.values()].join(' ')} ${JSON.stringify(service.exportBackup())}`;assert.doesNotMatch(persisted,/masculine|feminine|anatomy\/(?:neutral|masculine|feminine)|familyId|assetId|assetRef|standaloneAsset|guideX|radiusX|radiusY|headWidest|neckBase|shoulderRight/);assert.equal(service.exportBackup().schemaVersion,4);
});

test('standalone hydration validation rejects misleading or unsafe inputs before overlays reveal',()=>{assert.equal(standaloneSvgIssue('<svg viewBox="0 0 10 10"><path id="line" d="M0 0L1 1"/></svg>','0 0 10 10'),undefined);assert.equal(standaloneSvgIssue('<svg viewBox="0 0 9 9"><path/></svg>','0 0 10 10'),'unexpected viewBox');assert.equal(standaloneSvgIssue('<svg viewBox="0 0 10 10"><title>Empty</title></svg>','0 0 10 10'),'empty SVG');assert.equal(standaloneSvgIssue('<svg viewBox="0 0 10 10"><script/><path/></svg>','0 0 10 10'),'unsafe external SVG content');assert.equal(standaloneSvgIssue('<svg viewBox="0 0 10 10"><image href="https://example.test/a.png"/></svg>','0 0 10 10'),'unsafe external SVG content');const sourceText=readFile(new URL('../src/app/ui/anatomy-illustration.ts',import.meta.url),'utf8');return sourceText.then(source=>{assert.match(source,/sigma-anatomy-\$\{\+\+standaloneInstance\}-/);assert.match(source,/overlay\?\.removeAttribute\('hidden'\)/);assert.match(source,/overlay\?\.setAttribute\('hidden',''\)/);});});

test('standalone layout contains the shared SVG viewport without transforming model or overlay independently',async()=>{const css=await readFile(new URL('../src/styles.css',import.meta.url),'utf8'),renderer=await readFile(new URL('../src/app/ui/anatomy-illustration.ts',import.meta.url),'utf8');assert.match(css,/\.anatomy-figure\s*\{[^}]*box-sizing:\s*border-box;[^}]*max-width:\s*100%;/);assert.match(css,/\.anatomy-svg\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*height:\s*auto;/);assert.match(css,/\.anatomy-figure-standalone \.anatomy-svg\s*\{[^}]*max-height:\s*22rem;[^}]*overflow:\s*hidden;/);assert.doesNotMatch(css,/\.anatomy-(?:model|overlay)\s*\{[^}]*transform\s*:/);assert.doesNotMatch(renderer,/class="anatomy-(?:model|overlay)"[^>]*\btransform=/);assert.match(renderer,/<use class="anatomy-model" href="\$\{asset\.assetRef\}#\$\{asset\.symbolId\}"\/>/);assert.match(renderAnatomyIllustration('measurement.back-width'),/class="anatomy-figure anatomy-figure-standalone"/);assert.match(renderAnatomyIllustration('measurement.foot-width'),/class="anatomy-figure anatomy-figure-standalone"/);});

test('point, curved and circumference definitions use fact-specific declared anchors',()=>{
 assert.deepEqual(fact('shoulder-width').geometry,{kind:'point-to-point',start:'shoulderLeft',end:'shoulderRight'});
 assert.deepEqual(fact('hand-length').geometry,{kind:'point-to-point',start:'palmBase',end:'fingertip'});
 assert.deepEqual(fact('inseam').geometry,{kind:'vertical',start:'crotch',end:'ankle'});
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
 const cases=[['hand-length','palmBase','fingertip'],['foot-length','heel','longestToe'],['foot-width','ballInner','ballOuter'],['arch-length','heel','ballInner']];
 for(const [id,start,end] of cases){const html=renderAnatomyIllustration(`measurement.${id}`);assert.match(html,new RegExp(`data-start-anchor="${start}" data-end-anchor="${end}"`));const item=fact(id),asset=anatomyAssetFor(item,'neutral'),a=asset.anchors[start],b=asset.anchors[end];assert.match(html,new RegExp(`d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}"`));}
});

test('orientation assets are deliberate drawings rather than transformed front or side copies',async()=>{
 const asset=await readFile(new URL('../src/assets/anatomy-model.svg',import.meta.url),'utf8');
 for(const id of ['body-front','body-back','body-side','head-front','head-side','neck-front','neck-side','torso-front','torso-back','torso-side','upper-limb-front','upper-limb-side','hand-palm','hand-back','hand-side','finger-detail','lower-limb-front','lower-limb-back','lower-limb-side','foot-top','foot-side','foot-sole']){const symbol=asset.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?<\\/symbol>`))?.[0];assert.ok(symbol,id);assert.doesNotMatch(symbol,/transform=|rotate\(|scale\(/,id);if(id!=='scale-front')assert.match(symbol,/<(path|ellipse|g)\b/,id);}
 assert.notEqual(asset.match(/<symbol id="foot-top"[\s\S]*?<\/symbol>/)[0],asset.match(/<symbol id="foot-side"[\s\S]*?<\/symbol>/)[0]);
});

test('resolution remains canonical-only and SVG accessibility stays non-interactive',()=>{assert.equal(anatomyIllustrationFor('Waist circumference'),undefined);assert.equal(anatomyIllustrationFor(undefined),undefined);assert.equal(renderAnatomyIllustration('custom.waist'),'');const html=renderAnatomyIllustration('measurement.foot-length');assert.match(html,/role="img"/);assert.match(html,/tabindex="-1"/);assert.match(html,/<title[^>]*>Foot length/);assert.match(html,/<desc[^>]*>Top foot view/);});
