import { anatomyFamilyAssetForView, anatomyModelFamilyIds, type AnatomyModelFamilyId, type StandaloneAnatomyViewId } from '../../domain/anatomy.js';
import type { AnatomyPath } from '../../domain/canonical-facts.js';
import { anatomyChildRegions, anatomyPathKey } from '../../domain/anatomy-discovery.js';
import { anatomyFamilyFromLocation } from './anatomy-illustration.js';
import { escapeHtml as e } from './html.js';

type NavigationRect=Readonly<{x:number;y:number;width:number;height:number}>;
export interface AnatomyNavigationRegion {path:AnatomyPath;label:string;rects:readonly NavigationRect[];}
export interface AnatomyNavigationView {path:AnatomyPath;assetView:StandaloneAnatomyViewId;label:string;regions:readonly AnatomyNavigationRegion[];}

const rootSemantics=Object.freeze([
  {path:['Body','Head and neck'] as AnatomyPath,label:'Head and neck'},
  {path:['Body','Torso'] as AnatomyPath,label:'Torso'},
  {path:['Body','Upper limbs'] as AnatomyPath,label:'Upper limbs'},
  {path:['Body','Lower limbs'] as AnatomyPath,label:'Lower limbs'}
]);
const rootGeometry:Readonly<Record<AnatomyModelFamilyId,readonly (readonly NavigationRect[])[]>>=Object.freeze({
  neutral:[[{x:38,y:0,width:41,height:52}],[{x:29,y:43,width:59,height:105}],[{x:0,y:48,width:31,height:105},{x:86,y:48,width:31,height:105}],[{x:27,y:143,width:62,height:137}]],
  masculine:[[{x:41,y:0,width:45,height:58}],[{x:30,y:50,width:68,height:120}],[{x:0,y:57,width:32,height:140},{x:95,y:57,width:32,height:140}],[{x:31,y:165,width:66,height:165}]],
  feminine:[[{x:55,y:0,width:60,height:95}],[{x:42,y:90,width:85,height:200}],[{x:0,y:100,width:45,height:240},{x:124,y:100,width:45,height:240}],[{x:40,y:280,width:90,height:309}]]
});
const detailViews=Object.freeze([
  {path:['Body','Upper limbs'] as AnatomyPath,assetView:'upper-limb-front' as const,label:'Upper limb',regions:[{path:['Body','Upper limbs','Hand'] as AnatomyPath,label:'Hand',rects:[{x:620,y:650,width:300,height:320}]}]},
  {path:['Body','Upper limbs','Hand'] as AnatomyPath,assetView:'hand-palm' as const,label:'Hand',regions:[{path:['Body','Upper limbs','Hand','Fingers'] as AnatomyPath,label:'Fingers',rects:[{x:285,y:70,width:450,height:440}]}]},
  {path:['Body','Upper limbs','Hand','Fingers'] as AnatomyPath,assetView:'finger-detail' as const,label:'Fingers',regions:[]},
  {path:['Body','Lower limbs'] as AnatomyPath,assetView:'lower-limb-front' as const,label:'Lower limb',regions:[{path:['Body','Lower limbs','Foot'] as AnatomyPath,label:'Foot',rects:[{x:245,y:700,width:510,height:290}]}]},
  {path:['Body','Lower limbs','Foot'] as AnatomyPath,assetView:'foot-top' as const,label:'Foot',regions:[]}
] satisfies readonly AnatomyNavigationView[]);

const rootView=(family:AnatomyModelFamilyId):AnatomyNavigationView=>({path:['Body'],assetView:'body-front',label:'Body',regions:rootSemantics.map((region,index)=>({...region,rects:rootGeometry[family][index]}))});
export const anatomyNavigationViewFor=(path:AnatomyPath,family:AnatomyModelFamilyId):AnatomyNavigationView=>detailViews.find(view=>anatomyPathKey(view.path)===anatomyPathKey(path))??rootView(family);
export const anatomyNavigationRegions=(family:AnatomyModelFamilyId):readonly AnatomyNavigationRegion[]=>rootView(family).regions;
export const anatomyNavigationFamilies=anatomyModelFamilyIds;

export function renderAnatomyNavigator(path:AnatomyPath=['Body'],family:AnatomyModelFamilyId=anatomyFamilyFromLocation()):string {
  const view=anatomyNavigationViewFor(path,family),asset=anatomyFamilyAssetForView(family,view.assetView);if(!asset)return '';
  const fallback=anatomyPathKey(view.path)!==anatomyPathKey(path),semanticChildren=anatomyChildRegions(path).map(anatomyPathKey),regions=fallback?view.regions:view.regions.filter(region=>semanticChildren.includes(anatomyPathKey(region.path)));
  if(!fallback&&regions.length!==semanticChildren.length)return '';
  const hitAreas=regions.map(region=>`<g class="anatomy-navigation-region" data-anatomy-visual-path="${e(anatomyPathKey(region.path))}" data-region-label="${e(region.label)}">${region.rects.map(rect=>`<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}"/>`).join('')}</g>`).join('');
  return `<figure class="anatomy-navigator anatomy-figure anatomy-figure-standalone" data-anatomy-view="${e(anatomyPathKey(path))}" data-model-family="${family}" data-asset-id="${asset.assetId}"><svg class="anatomy-svg anatomy-navigator-svg" viewBox="${asset.viewBox}" aria-hidden="true" focusable="false"><g class="anatomy-model" data-standalone-asset="${asset.assetRef}" data-standalone-view-box="${asset.viewBox}"></g><g class="anatomy-overlay anatomy-navigation-overlay" hidden>${hitAreas}</g></svg><figcaption>${regions.length?`Choose ${e(regions.map(region=>region.label).join(' or '))} on the figure or use the equivalent button.`:`${e(view.label)} detail; choose a measurement from the semantic controls.`}</figcaption></figure>`;
}
