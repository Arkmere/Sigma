export const anatomyModelFamilyIds=['neutral','masculine','feminine'] as const;
export type AnatomyModelFamilyId=typeof anatomyModelFamilyIds[number];
export const anatomyRegionIds=['body','head','neck','torso','upper-limb','hand','finger','lower-limb','foot','scale'] as const;
export type AnatomyRegionId=typeof anatomyRegionIds[number];
export const anatomyOrientations=['front','back','side','top','palm','sole','detail'] as const;
export type AnatomyOrientation=typeof anatomyOrientations[number];
export const overlayTypes=['circumference','point-to-point','vertical','curved','tool'] as const;
export type AnatomyOverlayType=typeof overlayTypes[number];
export type AnatomySymbolId=`${AnatomyRegionId}-${AnatomyOrientation}`;
export type AnatomyPoint=readonly [x:number,y:number];
export const standaloneAnatomyAssetIds=['neutral-body-front','neutral-body-back','neutral-body-side','masculine-body-front','masculine-body-back','masculine-body-side','feminine-body-front','feminine-body-back','feminine-body-side','feminine-head-front','feminine-head-side'] as const;
export type StandaloneAnatomyAssetId=typeof standaloneAnatomyAssetIds[number];

export const anatomyAnchors=Object.freeze({
 crown:'Crown of head',floor:'Level floor',headWidest:'Widest head level',neckBase:'Base of neck',chestLevel:'Full chest level',bustLevel:'Full bust level',underbustLine:'Underbust line',naturalWaist:'Natural waist',naturalWaistFront:'Natural waist at centre front',naturalWaistBack:'Natural waist at centre back',fullHip:'Full hip level',shoulderLeft:'Left shoulder point',shoulderRight:'Right shoulder point',backLeft:'Left back landmark',backRight:'Right back landmark',neckBack:'Back neck point',crotch:'Crotch junction',elbow:'Elbow',upperArmFull:'Fullest upper arm',forearmFull:'Fullest forearm',wristCrease:'Wrist crease',fingertip:'Longest fingertip',palmBase:'Palm base',palmLeft:'Left palm edge',palmRight:'Right palm edge',palmCentre:'Palm circumference centre',knuckleBase:'Knuckle or ring base',thighFull:'Full thigh level',kneeCentre:'Knee centre',calfFull:'Full calf level',ankle:'Ankle landmark',heel:'Back of heel',longestToe:'Longest toe',ballInner:'Inner ball joint',ballOuter:'Outer ball joint',ballCentre:'Ball circumference centre',instep:'Highest instep point',instepLoopCentre:'Instep circumference centre',soleBelowInstep:'Sole beneath instep',scale:'Standing scales'
} as const);
export type AnatomyAnchorId=keyof typeof anatomyAnchors;

export type AnatomyOverlayDefinition=
 | {kind:'point-to-point'|'vertical';start:AnatomyAnchorId;end:AnatomyAnchorId}
 | {kind:'curved';start:AnatomyAnchorId;via:readonly AnatomyAnchorId[];end:AnatomyAnchorId;direction:boolean}
 | {kind:'circumference';centre:AnatomyAnchorId;hiddenRear:boolean;landmark?:AnatomyAnchorId}
 | {kind:'tool';anchor:AnatomyAnchorId};

export interface AnatomyIllustrationDefinition{
 id:`illustration.${string}`;canonicalFactId:`measurement.${string}`;region:AnatomyRegionId;orientation:AnatomyOrientation;anchors:readonly AnatomyAnchorId[];overlay:AnatomyOverlayType;geometry:AnatomyOverlayDefinition;title:string;description:string;caption:string;theme:'semantic-tokens';
}
export interface AnatomyFamilyAssetDefinition{assetId:StandaloneAnatomyAssetId;familyId:AnatomyModelFamilyId;assetVersion:'v1';assetRef:`/anatomy/${AnatomyModelFamilyId}/${string}.svg`;viewBox:string;anchors:Readonly<Partial<Record<AnatomyAnchorId,AnatomyPoint>>>;guideX?:number;circumferences?:Readonly<Partial<Record<AnatomyAnchorId,Readonly<{radiusX:number;radiusY:number}>>>>;}
export interface ResolvedAnatomyAssetDefinition{assetId:string;familyId:AnatomyModelFamilyId;assetVersion:'v1';assetRef:string;viewBox:string;anchors:Readonly<Partial<Record<AnatomyAnchorId,AnatomyPoint>>>;symbolId?:AnatomySymbolId;guideX?:number;circumferences?:Readonly<Partial<Record<AnatomyAnchorId,Readonly<{radiusX:number;radiusY:number}>>>>;}

const points=(value:Partial<Record<AnatomyAnchorId,AnatomyPoint>>)=>Object.freeze(value);
export const anatomySymbolAnchors:Readonly<Record<AnatomySymbolId,Readonly<Partial<Record<AnatomyAnchorId,AnatomyPoint>>>>>=Object.freeze({
 'body-side':points({crown:[123,10],floor:[123,222],neckBack:[109,56],naturalWaist:[112,124]}),
 'scale-front':points({scale:[120,203]}),
 'head-side':points({headWidest:[120,91]}),
 'neck-front':points({neckBase:[120,159]}),
 'torso-front':points({chestLevel:[120,88],bustLevel:[120,103],underbustLine:[120,118],naturalWaist:[120,142],fullHip:[120,181]}),
 'torso-back':points({shoulderLeft:[78,60],shoulderRight:[162,60],backLeft:[91,91],backRight:[149,91]}),
 'torso-side':points({neckBack:[101,51],naturalWaist:[105,142]}),
 'upper-limb-front':points({shoulderRight:[115,30],upperArmFull:[116,71],elbow:[119,112],forearmFull:[121,145],wristCrease:[123,199]}),
 'upper-limb-side':points({neckBack:[73,39],shoulderRight:[108,52],elbow:[145,119],wristCrease:[116,202]}),
 'hand-detail':points({wristCrease:[120,202]}),
 'hand-palm':points({palmBase:[120,202],fingertip:[126,18],palmLeft:[86,137],palmRight:[157,137],palmCentre:[121,137]}),
 'finger-detail':points({knuckleBase:[120,151]}),
 'lower-limb-front':points({naturalWaist:[120,38],crotch:[120,86],thighFull:[101,105],kneeCentre:[103,145],floor:[103,218]}),
 'lower-limb-back':points({naturalWaist:[120,38],crotch:[120,86],calfFull:[139,169]}),
 'lower-limb-side':points({naturalWaist:[108,39],naturalWaistFront:[132,42],naturalWaistBack:[96,42],crotch:[119,91],floor:[128,218]}),
 'lower-limb-detail':points({ankle:[120,191]}),
 'foot-top':points({heel:[120,207],longestToe:[120,25],ballInner:[93,83],ballOuter:[158,91],ballCentre:[126,87]}),
 'foot-side':points({heel:[62,184],ballInner:[157,167],instep:[126,105],instepLoopCentre:[126,147],soleBelowInstep:[126,190]})
} as Partial<Record<AnatomySymbolId,Readonly<Partial<Record<AnatomyAnchorId,AnatomyPoint>>>>> as Record<AnatomySymbolId,Readonly<Partial<Record<AnatomyAnchorId,AnatomyPoint>>>>);

export const standaloneAnatomyAnchors:Readonly<Record<StandaloneAnatomyAssetId,Readonly<Partial<Record<AnatomyAnchorId,AnatomyPoint>>>>>=Object.freeze({
 'neutral-body-side':points({crown:[25.75,.59],floor:[28,279.2]}),
 'neutral-body-front':points({naturalWaist:[58.44,104]}),
 'neutral-body-back':points({shoulderLeft:[26,58],shoulderRight:[91,58]}),
 'masculine-body-side':points({crown:[30.5,1.5],floor:[30.5,334]}),
 'masculine-body-front':points({naturalWaist:[63.6,143]}),
 'masculine-body-back':points({shoulderLeft:[18,67],shoulderRight:[112.5,67]}),
 'feminine-body-side':points({crown:[48.3,1],floor:[48,586]}),
 'feminine-body-front':points({naturalWaist:[84.5,218]}),
 'feminine-body-back':points({shoulderLeft:[21,124],shoulderRight:[150,124]}),
 'feminine-head-front':points({}),
 'feminine-head-side':points({})
});

type Seed={fact:string;region:AnatomyRegionId;orientation:AnatomyOrientation;geometry:AnatomyOverlayDefinition;title:string;description:string};
const circumference=(centre:AnatomyAnchorId,_radiusX:number,_radiusY:number,landmark=centre):AnatomyOverlayDefinition=>({kind:'circumference',centre,hiddenRear:true,landmark});
const line=(kind:'point-to-point'|'vertical',start:AnatomyAnchorId,end:AnatomyAnchorId):AnatomyOverlayDefinition=>({kind,start,end});
const seeds:readonly Seed[]=[
 {fact:'height',region:'body',orientation:'side',geometry:line('vertical','floor','crown'),title:'Height measurement',description:'Side view showing a vertical path from level floor to the crown of the head.'},
 {fact:'weight',region:'scale',orientation:'front',geometry:{kind:'tool',anchor:'scale'},title:'Weight measurement',description:'Neutral standing figure centred on level scales; no body measurement path is implied.'},
 {fact:'head-circumference',region:'head',orientation:'side',geometry:circumference('headWidest',51,15),title:'Head circumference',description:'Side head view showing a closed path above the eyebrows and ears around the widest head level.'},
 {fact:'neck-circumference',region:'neck',orientation:'front',geometry:circumference('neckBase',29,9),title:'Neck circumference',description:'Front neck detail showing a closed level path around the base of the neck.'},
 {fact:'chest-circumference',region:'torso',orientation:'front',geometry:circumference('chestLevel',49,12),title:'Chest circumference',description:'Front torso showing a closed horizontal path at the fullest chest level.'},
 {fact:'bust-circumference',region:'torso',orientation:'front',geometry:circumference('bustLevel',53,13),title:'Bust circumference',description:'Front neutral torso showing a closed horizontal path at the fullest bust level.'},
 {fact:'underbust-circumference',region:'torso',orientation:'front',geometry:circumference('underbustLine',47,11),title:'Underbust circumference',description:'Front neutral torso showing a closed path around the ribcage directly below the bust level.'},
 {fact:'waist-circumference',region:'torso',orientation:'front',geometry:circumference('naturalWaist',41,10),title:'Waist circumference',description:'Front torso showing a closed path around the natural waist between the lowest ribs and hip bones.'},
 {fact:'hip-circumference',region:'torso',orientation:'front',geometry:circumference('fullHip',54,13),title:'Hip circumference',description:'Front torso showing a closed horizontal path around the fullest hip level.'},
 {fact:'shoulder-width',region:'torso',orientation:'back',geometry:line('point-to-point','shoulderLeft','shoulderRight'),title:'Shoulder width',description:'Back torso showing a solid path between the left and right shoulder points.'},
 {fact:'back-width',region:'torso',orientation:'back',geometry:line('point-to-point','backLeft','backRight'),title:'Back width',description:'Back torso showing a solid path between matching back landmarks below the shoulders.'},
 {fact:'torso-length',region:'torso',orientation:'side',geometry:line('vertical','neckBack','naturalWaist'),title:'Torso length',description:'Side torso showing a body-following path from the back neck point to natural waist.'},
 {fact:'arm-length',region:'upper-limb',orientation:'front',geometry:{kind:'curved',start:'shoulderRight',via:['elbow'],end:'wristCrease',direction:false},title:'Arm length',description:'Front arm view showing a path from shoulder point through elbow to wrist crease.'},
 {fact:'sleeve-length',region:'upper-limb',orientation:'side',geometry:{kind:'curved',start:'neckBack',via:['shoulderRight','elbow'],end:'wristCrease',direction:true},title:'Sleeve length',description:'Side upper-limb view showing a curved path from back neck through shoulder and elbow to wrist.'},
 {fact:'upper-arm-circumference',region:'upper-limb',orientation:'front',geometry:circumference('upperArmFull',21,7),title:'Upper-arm circumference',description:'Arm detail showing a closed path around the fullest upper arm.'},
 {fact:'forearm-circumference',region:'upper-limb',orientation:'front',geometry:circumference('forearmFull',18,6),title:'Forearm circumference',description:'Arm detail showing a closed path around the fullest forearm.'},
 {fact:'wrist-circumference',region:'hand',orientation:'detail',geometry:circumference('wristCrease',17,6),title:'Wrist circumference',description:'Hand detail showing a closed path around the wrist at the wrist crease.'},
 {fact:'hand-length',region:'hand',orientation:'palm',geometry:line('point-to-point','palmBase','fingertip'),title:'Hand length',description:'Palm view showing a solid path from the palm base to the longest fingertip.'},
 {fact:'hand-width',region:'hand',orientation:'palm',geometry:line('point-to-point','palmLeft','palmRight'),title:'Hand width',description:'Palm view showing a solid path across the widest part of the palm.'},
 {fact:'palm-circumference',region:'hand',orientation:'palm',geometry:circumference('palmCentre',36,10,'palmRight'),title:'Palm circumference',description:'Palm view showing a closed path around the knuckles while excluding the thumb.'},
 {fact:'finger-circumference',region:'finger',orientation:'detail',geometry:circumference('knuckleBase',27,8),title:'Finger circumference',description:'Finger close-up showing a closed ring-position path and the knuckle landmark.'},
 {fact:'inseam',region:'lower-limb',orientation:'front',geometry:line('vertical','crotch','floor'),title:'Inseam',description:'Front lower-body view showing a vertical path from crotch junction down the inside leg.'},
 {fact:'outseam',region:'lower-limb',orientation:'side',geometry:line('vertical','naturalWaist','floor'),title:'Outseam',description:'Side lower-body view showing a path from natural waist down the outside leg.'},
 {fact:'rise',region:'lower-limb',orientation:'side',geometry:{kind:'curved',start:'naturalWaistFront',via:['crotch'],end:'naturalWaistBack',direction:true},title:'Rise',description:'Side lower-body view showing a curved path from front waist through the crotch to back waist.'},
 {fact:'front-rise',region:'lower-limb',orientation:'front',geometry:line('vertical','naturalWaist','crotch'),title:'Front rise',description:'Front lower-body view showing a path from centre-front natural waist to crotch junction.'},
 {fact:'back-rise',region:'lower-limb',orientation:'back',geometry:line('vertical','crotch','naturalWaist'),title:'Back rise',description:'Back lower-body view showing a path from crotch junction to centre-back natural waist.'},
 {fact:'thigh-circumference',region:'lower-limb',orientation:'front',geometry:circumference('thighFull',27,8),title:'Thigh circumference',description:'Lower-limb detail showing a closed path around the fullest upper thigh.'},
 {fact:'knee-circumference',region:'lower-limb',orientation:'front',geometry:circumference('kneeCentre',22,7),title:'Knee circumference',description:'Lower-limb detail showing a closed path around kneecap level.'},
 {fact:'calf-circumference',region:'lower-limb',orientation:'back',geometry:circumference('calfFull',25,8),title:'Calf circumference',description:'Back lower-limb detail showing a closed path around the fullest calf.'},
 {fact:'ankle-circumference',region:'lower-limb',orientation:'detail',geometry:circumference('ankle',18,6),title:'Ankle circumference',description:'Lower-limb close-up showing a closed path just above the ankle bones.'},
 {fact:'foot-length',region:'foot',orientation:'top',geometry:line('point-to-point','heel','longestToe'),title:'Foot length',description:'Top foot view showing a solid path from the back of the heel to the longest toe.'},
 {fact:'foot-width',region:'foot',orientation:'top',geometry:line('point-to-point','ballInner','ballOuter'),title:'Foot width',description:'Top foot view showing a solid path across the widest ball joints.'},
 {fact:'foot-circumference',region:'foot',orientation:'top',geometry:circumference('ballCentre',34,12,'ballOuter'),title:'Foot circumference',description:'Top foot view showing a closed path around the widest ball joints.'},
 {fact:'arch-length',region:'foot',orientation:'side',geometry:line('point-to-point','heel','ballInner'),title:'Arch length',description:'Side foot view showing a solid path from heel to the first ball joint.'},
 {fact:'instep-circumference',region:'foot',orientation:'side',geometry:circumference('instepLoopCentre',31,42,'instep'),title:'Instep circumference',description:'Side foot view showing a closed upright path over the highest instep point and under the foot.'}
];
const geometryAnchors=(geometry:AnatomyOverlayDefinition):readonly AnatomyAnchorId[]=>geometry.kind==='tool'?[geometry.anchor]:geometry.kind==='circumference'?[geometry.centre,...geometry.landmark&&geometry.landmark!==geometry.centre?[geometry.landmark]:[]]:geometry.kind==='curved'?[geometry.start,...geometry.via,geometry.end]:[geometry.start,geometry.end];
export const anatomyIllustrations:readonly AnatomyIllustrationDefinition[]=Object.freeze(seeds.map(seed=>({id:`illustration.${seed.fact}`,canonicalFactId:`measurement.${seed.fact}`,region:seed.region,orientation:seed.orientation,anchors:geometryAnchors(seed.geometry),overlay:seed.geometry.kind,geometry:seed.geometry,title:seed.title,description:seed.description,caption:`${seed.title} · ${seed.orientation} view`,theme:'semantic-tokens'} as AnatomyIllustrationDefinition)));
const byFact=new Map<string,AnatomyIllustrationDefinition>(anatomyIllustrations.map(item=>[item.canonicalFactId,item]));
export const anatomyIllustrationFor=(canonicalFactId:string|undefined):AnatomyIllustrationDefinition|undefined=>canonicalFactId?byFact.get(canonicalFactId):undefined;
export const anatomyPointFor=(symbolId:AnatomySymbolId,anchor:AnatomyAnchorId):AnatomyPoint|undefined=>anatomySymbolAnchors[symbolId]?.[anchor];

const standalone=(assetId:StandaloneAnatomyAssetId,familyId:AnatomyModelFamilyId,assetRef:AnatomyFamilyAssetDefinition['assetRef'],viewBox:string,extra:Pick<AnatomyFamilyAssetDefinition,'guideX'|'circumferences'>={}):AnatomyFamilyAssetDefinition=>Object.freeze({assetId,familyId,assetVersion:'v1',assetRef,viewBox,anchors:standaloneAnatomyAnchors[assetId],...extra});
export const anatomyFamilyAssets:readonly AnatomyFamilyAssetDefinition[]=Object.freeze([
 standalone('neutral-body-side','neutral','/anatomy/neutral/body-side.svg','0 0 46.56 279.84',{guideX:1.5}),
 standalone('neutral-body-front','neutral','/anatomy/neutral/body-front.svg','0 0 116.88 280.08',{circumferences:{naturalWaist:{radiusX:22,radiusY:5.5}}}),
 standalone('neutral-body-back','neutral','/anatomy/neutral/body-back.svg','0 0 116.88 279.6'),
 standalone('masculine-body-side','masculine','/anatomy/masculine/body-side.svg','0 0 60.96 335.76',{guideX:4}),
 standalone('masculine-body-front','masculine','/anatomy/masculine/body-front.svg','0 0 127.2 329.52',{circumferences:{naturalWaist:{radiusX:41,radiusY:10}}}),
 standalone('masculine-body-back','masculine','/anatomy/masculine/body-back.svg','0 0 130.56 340.08'),
 standalone('feminine-body-side','feminine','/anatomy/feminine/body-side.svg','0 0 96 587',{guideX:92}),
 standalone('feminine-body-front','feminine','/anatomy/feminine/body-front.svg','0 0 169 589.18',{circumferences:{naturalWaist:{radiusX:52,radiusY:13}}}),
 standalone('feminine-body-back','feminine','/anatomy/feminine/body-back.svg','0 0 171 586.33'),
 standalone('feminine-head-front','feminine','/anatomy/feminine/head-front.svg','0 0 445 581'),
 standalone('feminine-head-side','feminine','/anatomy/feminine/head-side.svg','0 0 397 580')
]);
const familyAssetsById=new Map(anatomyFamilyAssets.map(asset=>[asset.assetId,asset]));
const familyFactAssets:Readonly<Record<AnatomyModelFamilyId,Readonly<Partial<Record<string,StandaloneAnatomyAssetId>>>>>=Object.freeze({
 neutral:{'measurement.height':'neutral-body-side','measurement.waist-circumference':'neutral-body-front','measurement.shoulder-width':'neutral-body-back'},
 masculine:{'measurement.height':'masculine-body-side','measurement.waist-circumference':'masculine-body-front','measurement.shoulder-width':'masculine-body-back'},
 feminine:{'measurement.height':'feminine-body-side','measurement.waist-circumference':'feminine-body-front','measurement.shoulder-width':'feminine-body-back'}
});
const neutralCircumferences:Readonly<Record<string,Readonly<{radiusX:number;radiusY:number}>>>=Object.freeze({'measurement.head-circumference':{radiusX:51,radiusY:15},'measurement.neck-circumference':{radiusX:29,radiusY:9},'measurement.chest-circumference':{radiusX:49,radiusY:12},'measurement.bust-circumference':{radiusX:53,radiusY:13},'measurement.underbust-circumference':{radiusX:47,radiusY:11},'measurement.waist-circumference':{radiusX:41,radiusY:10},'measurement.hip-circumference':{radiusX:54,radiusY:13},'measurement.upper-arm-circumference':{radiusX:21,radiusY:7},'measurement.forearm-circumference':{radiusX:18,radiusY:6},'measurement.wrist-circumference':{radiusX:17,radiusY:6},'measurement.palm-circumference':{radiusX:36,radiusY:10},'measurement.finger-circumference':{radiusX:27,radiusY:8},'measurement.thigh-circumference':{radiusX:27,radiusY:8},'measurement.knee-circumference':{radiusX:22,radiusY:7},'measurement.calf-circumference':{radiusX:25,radiusY:8},'measurement.ankle-circumference':{radiusX:18,radiusY:6},'measurement.foot-circumference':{radiusX:34,radiusY:12},'measurement.instep-circumference':{radiusX:31,radiusY:42}});
export const anatomyFamilyFrom=(value:string|null|undefined):AnatomyModelFamilyId=>anatomyModelFamilyIds.includes(value as AnatomyModelFamilyId)?value as AnatomyModelFamilyId:'neutral';
export const anatomyAssetFor=(item:AnatomyIllustrationDefinition,familyValue:AnatomyModelFamilyId|'unknown'='neutral'):ResolvedAnatomyAssetDefinition=>{const family=anatomyFamilyFrom(familyValue),assetId=familyFactAssets[family][item.canonicalFactId],asset=assetId&&familyAssetsById.get(assetId);if(asset)return asset;const symbolId=`${item.region}-${item.orientation}` as AnatomySymbolId,circumference=neutralCircumferences[item.canonicalFactId];return {assetId:`neutral-${symbolId}`,familyId:'neutral',assetVersion:'v1',assetRef:'/anatomy-model.svg',viewBox:'0 0 240 240',anchors:anatomySymbolAnchors[symbolId],symbolId,circumferences:circumference&&item.geometry.kind==='circumference'?{[item.geometry.centre]:circumference}:undefined};};
export const anatomyPointForIllustration=(item:AnatomyIllustrationDefinition,anchor:AnatomyAnchorId,family:AnatomyModelFamilyId='neutral'):AnatomyPoint|undefined=>anatomyAssetFor(item,family).anchors[anchor];
