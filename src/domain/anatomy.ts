export const anatomyModelFamilyIds = ['sigma-neutral-v1'] as const;
export type AnatomyModelFamilyId = typeof anatomyModelFamilyIds[number];
export const anatomyRegionIds = ['body','head','neck','torso','upper-limb','hand','finger','lower-limb','foot','scale'] as const;
export type AnatomyRegionId = typeof anatomyRegionIds[number];
export const anatomyOrientations = ['front','back','side','top','palm','sole','detail'] as const;
export type AnatomyOrientation = typeof anatomyOrientations[number];
export const overlayTypes = ['circumference','point-to-point','vertical','curved','tool'] as const;
export type AnatomyOverlayType = typeof overlayTypes[number];

export const anatomyAnchors = Object.freeze({
  crown:'Crown of head', floor:'Level floor', headWidest:'Widest head level', neckBase:'Base of neck',
  chestLevel:'Full chest level', bustLevel:'Full bust level', underbustLine:'Underbust line', naturalWaist:'Natural waist',
  fullHip:'Full hip level', shoulderLeft:'Left shoulder point', shoulderRight:'Right shoulder point', backLeft:'Left back landmark',
  backRight:'Right back landmark', neckBack:'Back neck point', crotch:'Crotch junction', elbow:'Elbow', wristCrease:'Wrist crease',
  fingertip:'Fingertip', palmBase:'Palm base', palmLeft:'Left palm edge', palmRight:'Right palm edge', knuckleBase:'Knuckle base',
  thighFull:'Full thigh level', kneeCentre:'Knee centre', calfFull:'Full calf level', ankle:'Ankle landmark', heel:'Back of heel',
  longestToe:'Longest toe', ballInner:'Inner ball joint', ballOuter:'Outer ball joint', instep:'Highest instep point', scale:'Standing scales'
} as const);
export type AnatomyAnchorId = keyof typeof anatomyAnchors;

export interface AnatomyIllustrationDefinition {
  id:`illustration.${string}`; canonicalFactId:`measurement.${string}`; modelFamilyId:AnatomyModelFamilyId;
  region:AnatomyRegionId; orientation:AnatomyOrientation; assetRef:'/anatomy-model.svg'; symbolId:`${AnatomyRegionId}-${AnatomyOrientation}`;
  anchors:readonly AnatomyAnchorId[]; overlay:AnatomyOverlayType; title:string; description:string; caption:string;
  theme:'semantic-tokens'; viewBox:'0 0 240 240'; fallbackId?:'illustration.generic-body';
}
type Seed=readonly [fact:string,region:AnatomyRegionId,orientation:AnatomyOrientation,overlay:AnatomyOverlayType,anchors:readonly AnatomyAnchorId[],title:string,description:string];
const s:readonly Seed[]=[
 ['height','body','side','vertical',['crown','floor'],'Height measurement','Side view showing a vertical path from level floor to the crown of the head.'],
 ['weight','scale','front','tool',['scale'],'Weight measurement','Neutral standing figure centred on level scales; no body measurement path is implied.'],
 ['head-circumference','head','side','circumference',['headWidest'],'Head circumference','Side head view showing a closed path above the eyebrows and ears around the widest head level.'],
 ['neck-circumference','neck','front','circumference',['neckBase'],'Neck circumference','Front neck detail showing a closed level path around the base of the neck.'],
 ['chest-circumference','torso','front','circumference',['chestLevel'],'Chest circumference','Front torso showing a closed horizontal path at the fullest chest level.'],
 ['bust-circumference','torso','front','circumference',['bustLevel'],'Bust circumference','Front neutral torso showing a closed horizontal path at the fullest bust level.'],
 ['underbust-circumference','torso','front','circumference',['underbustLine'],'Underbust circumference','Front neutral torso showing a closed path around the ribcage directly below the bust level.'],
 ['waist-circumference','torso','front','circumference',['naturalWaist'],'Waist circumference','Front torso showing a closed path around the natural waist between the lowest ribs and hip bones.'],
 ['hip-circumference','torso','front','circumference',['fullHip'],'Hip circumference','Front torso showing a closed horizontal path around the fullest hip level.'],
 ['shoulder-width','torso','back','point-to-point',['shoulderLeft','shoulderRight'],'Shoulder width','Back torso showing a solid path between the left and right shoulder points.'],
 ['back-width','torso','back','point-to-point',['backLeft','backRight'],'Back width','Back torso showing a solid path between matching back landmarks below the shoulders.'],
 ['torso-length','torso','side','vertical',['neckBack','naturalWaist'],'Torso length','Side torso showing a vertical body-following path from the back neck point to natural waist.'],
 ['arm-length','upper-limb','front','point-to-point',['shoulderRight','wristCrease'],'Arm length','Front arm view showing a path from shoulder point to wrist crease.'],
 ['sleeve-length','upper-limb','side','curved',['neckBack','elbow','wristCrease'],'Sleeve length','Side upper-limb view showing a curved path from back neck through shoulder and elbow to wrist.'],
 ['upper-arm-circumference','upper-limb','front','circumference',['shoulderRight'],'Upper-arm circumference','Arm detail showing a closed path around the fullest upper arm.'],
 ['forearm-circumference','upper-limb','front','circumference',['elbow'],'Forearm circumference','Arm detail showing a closed path around the fullest forearm.'],
 ['wrist-circumference','hand','detail','circumference',['wristCrease'],'Wrist circumference','Hand detail showing a closed path around the wrist at the wrist crease.'],
 ['hand-length','hand','palm','point-to-point',['palmBase','fingertip'],'Hand length','Palm view showing a solid path from the palm base to the longest fingertip.'],
 ['hand-width','hand','palm','point-to-point',['palmLeft','palmRight'],'Hand width','Palm view showing a solid path across the widest part of the palm.'],
 ['palm-circumference','hand','palm','circumference',['palmLeft','palmRight'],'Palm circumference','Palm view showing a closed path around the knuckles while excluding the thumb.'],
 ['finger-circumference','finger','detail','circumference',['knuckleBase'],'Finger circumference','Finger close-up showing a closed ring-position path and the knuckle landmark.'],
 ['inseam','lower-limb','front','vertical',['crotch','floor'],'Inseam','Front lower-body view showing a vertical path from crotch junction down the inside leg.'],
 ['outseam','lower-limb','side','vertical',['naturalWaist','floor'],'Outseam','Side lower-body view showing a vertical path from natural waist down the outside leg.'],
 ['rise','lower-limb','side','curved',['naturalWaist','crotch'],'Rise','Side lower-body view showing a curved path from front waist through the crotch to back waist.'],
 ['front-rise','lower-limb','front','vertical',['naturalWaist','crotch'],'Front rise','Front lower-body view showing a path from centre-front natural waist to crotch junction.'],
 ['back-rise','lower-limb','back','vertical',['crotch','naturalWaist'],'Back rise','Back lower-body view showing a path from crotch junction to centre-back natural waist.'],
 ['thigh-circumference','lower-limb','front','circumference',['thighFull'],'Thigh circumference','Lower-limb detail showing a closed path around the fullest upper thigh.'],
 ['knee-circumference','lower-limb','front','circumference',['kneeCentre'],'Knee circumference','Lower-limb detail showing a closed path around kneecap level.'],
 ['calf-circumference','lower-limb','back','circumference',['calfFull'],'Calf circumference','Back lower-limb detail showing a closed path around the fullest calf.'],
 ['ankle-circumference','lower-limb','detail','circumference',['ankle'],'Ankle circumference','Lower-limb close-up showing a closed path just above the ankle bones.'],
 ['foot-length','foot','top','point-to-point',['heel','longestToe'],'Foot length','Top foot view showing a solid path from the back of the heel to the longest toe.'],
 ['foot-width','foot','top','point-to-point',['ballInner','ballOuter'],'Foot width','Top foot view showing a solid path across the widest ball joints.'],
 ['foot-circumference','foot','top','circumference',['ballInner','ballOuter'],'Foot circumference','Top foot view showing a closed path around the widest ball joints.'],
 ['arch-length','foot','side','point-to-point',['heel','ballInner'],'Arch length','Side foot view showing a solid path from heel to the first ball joint.'],
 ['instep-circumference','foot','side','circumference',['instep'],'Instep circumference','Side foot view showing a closed upright path over the highest instep point and under the foot.']
];
export const anatomyIllustrations:readonly AnatomyIllustrationDefinition[]=Object.freeze(s.map(([fact,region,orientation,overlay,anchors,title,description])=>({
 id:`illustration.${fact}`,canonicalFactId:`measurement.${fact}`,modelFamilyId:'sigma-neutral-v1',region,orientation,assetRef:'/anatomy-model.svg',symbolId:`${region}-${orientation}`,anchors,overlay,title,description,caption:`${title} · ${orientation} view`,theme:'semantic-tokens',viewBox:'0 0 240 240'
} as AnatomyIllustrationDefinition)));
const byFact=new Map<string,AnatomyIllustrationDefinition>(anatomyIllustrations.map(item=>[item.canonicalFactId,item]));
export const anatomyIllustrationFor=(canonicalFactId:string|undefined):AnatomyIllustrationDefinition|undefined=>canonicalFactId?byFact.get(canonicalFactId):undefined;
