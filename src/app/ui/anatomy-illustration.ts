import { anatomyIllustrationFor, anatomyPointForIllustration, type AnatomyAnchorId, type AnatomyIllustrationDefinition, type AnatomyPoint } from '../../domain/anatomy.js';
import { escapeHtml as e } from './html.js';

const point=(item:AnatomyIllustrationDefinition,anchor:AnatomyAnchorId):AnatomyPoint=>{const value=anatomyPointForIllustration(item,anchor);if(!value)throw new Error(`Missing anatomy coordinate: ${item.standaloneAssetId??item.symbolId}.${anchor}`);return value;};
const marker=(kind:'start'|'end'|'landmark',anchor:AnatomyAnchorId,[x,y]:AnatomyPoint):string=>kind==='start'?`<circle class="anatomy-start" data-anchor="${anchor}" cx="${x}" cy="${y}" r="6"/>`:`<rect class="anatomy-${kind}" data-anchor="${anchor}" x="${x-6}" y="${y-6}" width="12" height="12"/>`;
const curvedPath=(points:readonly AnatomyPoint[]):string=>{let d=`M${points[0][0]} ${points[0][1]}`;for(let index=1;index<points.length-1;index++){const here=points[index],next=points[index+1],mid:[number,number]=[(here[0]+next[0])/2,(here[1]+next[1])/2];d+=` Q${here[0]} ${here[1]} ${mid[0]} ${mid[1]}`;}const end=points.at(-1)!;return `${d} L${end[0]} ${end[1]}`;};
function overlayFor(item:AnatomyIllustrationDefinition):string{
 const geometry=item.geometry;
 if(geometry.kind==='tool'){const [x,y]=point(item,geometry.anchor);return `<path class="anatomy-scale" data-anchor="${geometry.anchor}" d="M${x-46} ${y-18}h92l-8 32h-76z"/>`;}
 if(geometry.kind==='circumference'){
  const [x,y]=point(item,geometry.centre),landmark=geometry.landmark??geometry.centre,landmarkPoint=point(item,landmark);
  return `<ellipse class="anatomy-path anatomy-circumference" data-anchor="${geometry.centre}" cx="${x}" cy="${y}" rx="${geometry.radiusX}" ry="${geometry.radiusY}"/><path class="anatomy-hidden-path" data-anchor="${geometry.centre}" d="M${x-geometry.radiusX} ${y} A${geometry.radiusX} ${geometry.radiusY} 0 0 0 ${x+geometry.radiusX} ${y}"/>${marker('landmark',landmark,landmarkPoint)}`;
 }
 const start=point(item,geometry.start),end=point(item,geometry.end);
 if(geometry.kind==='curved'){
  const via=geometry.via.map(anchor=>point(item,anchor)),all=[start,...via,end],middle=all[Math.floor(all.length/2)];
  return `<path class="anatomy-path anatomy-curved" data-start-anchor="${geometry.start}" data-via-anchors="${geometry.via.join(' ')}" data-end-anchor="${geometry.end}" d="${curvedPath(all)}"/>${marker('start',geometry.start,start)}${marker('end',geometry.end,end)}${geometry.direction?`<path class="anatomy-direction" d="M${middle[0]-7} ${middle[1]-7}l12 7-12 7"/>`:''}`;
 }
 return `<path class="anatomy-path anatomy-${geometry.kind}" data-start-anchor="${geometry.start}" data-end-anchor="${geometry.end}" d="M${start[0]} ${start[1]} L${end[0]} ${end[1]}"/>${marker('start',geometry.start,start)}${marker('end',geometry.end,end)}`;
}
function legendFor(item:AnatomyIllustrationDefinition):string{
 if(item.geometry.kind==='tool')return '';
 if(item.geometry.kind==='circumference')return '<p class="anatomy-key"><span class="key-dashed">Closed circumference; short dashes show the rear path</span><span class="key-landmark">Landmark</span></p>';
 if(item.geometry.kind==='curved')return `<p class="anatomy-key"><span class="key-solid">Path with distinct start and end</span>${item.geometry.direction?'<span class="key-direction">Direction</span>':''}</p>`;
 return '<p class="anatomy-key"><span class="key-solid">Solid path with distinct start and end</span></p>';
}
export function renderAnatomyIllustration(canonicalFactId:string|undefined):string{
 const item=anatomyIllustrationFor(canonicalFactId);if(!item)return '';
 const titleId=`${item.id}-title`,descId=`${item.id}-desc`;
 const model=item.standaloneAssetId?`<g class="anatomy-model" data-standalone-asset="${item.assetRef}" data-standalone-view-box="${item.viewBox}"></g>`:`<use class="anatomy-model" href="${item.assetRef}#${item.symbolId}"/>`;
 const overlay=item.standaloneAssetId?`<g class="anatomy-overlay" hidden>${overlayFor(item)}</g>`:overlayFor(item);
 return `<figure class="anatomy-figure${item.standaloneAssetId?' anatomy-figure-standalone':''}" data-illustration-id="${item.id}" data-model-family="${item.modelFamilyId}" data-region="${item.region}" data-orientation="${item.orientation}" data-overlay="${item.overlay}"><svg class="anatomy-svg" viewBox="${item.viewBox}" role="img" tabindex="-1" aria-labelledby="${titleId} ${descId}" focusable="false"><title id="${titleId}">${e(item.title)}</title><desc id="${descId}">${e(item.description)}</desc>${model}${overlay}</svg><figcaption>${e(item.caption)}</figcaption>${legendFor(item)}</figure>`;
}

let standaloneInstance=0;
export async function hydrateStandaloneAnatomy(root:ParentNode,load:typeof fetch=globalThis.fetch):Promise<void>{
 const targets=[...root.querySelectorAll<SVGGElement>('[data-standalone-asset]')];
 await Promise.all(targets.map(async(target)=>{const assetRef=target.dataset.standaloneAsset!,expectedViewBox=target.dataset.standaloneViewBox!,figure=target.closest<HTMLElement>('.anatomy-figure'),overlay=target.parentElement?.querySelector<SVGGElement>('.anatomy-overlay');try{
  const response=await load(assetRef);if(!response.ok)throw new Error(`HTTP ${response.status}`);const source=new DOMParser().parseFromString(await response.text(),'image/svg+xml'),svg=source.documentElement;if(svg.localName!=='svg'||source.querySelector('parsererror'))throw new Error('invalid SVG');if(svg.getAttribute('viewBox')!==expectedViewBox)throw new Error('unexpected viewBox');if(source.querySelector('script,foreignObject,use[href^="http"],use[href^="/"]'))throw new Error('unsafe external SVG content');
  const prefix=`sigma-anatomy-${++standaloneInstance}-`;const ids=new Map<string,string>();source.querySelectorAll<SVGElement>('[id]').forEach(node=>{const id=node.id,next=`${prefix}${id}`;ids.set(id,next);node.id=next;});source.querySelectorAll<SVGElement>('*').forEach(node=>{for(const attribute of [...node.attributes]){let value=attribute.value;for(const [oldId,newId] of ids)value=value.replaceAll(`url(#${oldId})`,`url(#${newId})`).replaceAll(`#${oldId}`,`#${newId}`);node.setAttribute(attribute.name,value);}});
  for(const child of [...svg.children])if(!['title','desc'].includes(child.localName))target.append(document.importNode(child,true));if(!target.childElementCount)throw new Error('empty SVG');if(!target.isConnected)return;target.dataset.assetState='ready';overlay?.removeAttribute('hidden');
 }catch(error){target.dataset.assetState='error';overlay?.setAttribute('hidden','');if(globalThis.location?.hostname==='localhost'){const message=document.createElement('p');message.className='anatomy-load-error';message.textContent=`Development asset failure: ${assetRef}`;figure?.append(message);}console.error(`Failed to load standalone anatomy asset ${assetRef}.`,error);}}));
}
