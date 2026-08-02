import { anatomyIllustrationFor, type AnatomyIllustrationDefinition } from '../../domain/anatomy.js';
import { escapeHtml as e } from './html.js';

const overlayGeometry:Record<AnatomyIllustrationDefinition['overlay'],string>={
 circumference:'<ellipse class="anatomy-path anatomy-circumference" cx="120" cy="116" rx="50" ry="13"/><path class="anatomy-hidden-path" d="M70 116 A50 13 0 0 0 170 116"/><rect class="anatomy-landmark" x="116" y="110" width="8" height="8"/>',
 'point-to-point':'<path class="anatomy-path" d="M68 122 L172 122"/><circle class="anatomy-start" cx="68" cy="122" r="6"/><rect class="anatomy-end" x="166" y="116" width="12" height="12"/>',
 vertical:'<path class="anatomy-path" d="M120 43 L120 201"/><circle class="anatomy-start" cx="120" cy="43" r="6"/><rect class="anatomy-end" x="114" y="195" width="12" height="12"/>',
 curved:'<path class="anatomy-path" d="M80 75 Q160 120 118 194"/><circle class="anatomy-start" cx="80" cy="75" r="6"/><rect class="anatomy-end" x="112" y="188" width="12" height="12"/><path class="anatomy-direction" d="M137 129 l10 7 -12 3"/>',
 tool:'<path class="anatomy-scale" d="M74 184 h92 l-8 32 H82z"/><circle class="anatomy-landmark" cx="120" cy="198" r="11"/>'
};
const circumferenceLevel:Record<string,readonly [number,number,number]>={
 'measurement.head-circumference':[91,52,15],'measurement.neck-circumference':[153,28,9],
 'measurement.chest-circumference':[89,52,13],'measurement.bust-circumference':[102,54,14],
 'measurement.underbust-circumference':[116,48,12],'measurement.waist-circumference':[137,42,11],
 'measurement.hip-circumference':[174,55,14],'measurement.upper-arm-circumference':[76,27,9],
 'measurement.forearm-circumference':[130,22,8],'measurement.wrist-circumference':[190,18,7],
 'measurement.palm-circumference':[139,38,10],'measurement.finger-circumference':[153,28,8],
 'measurement.thigh-circumference':[78,31,9],'measurement.knee-circumference':[123,25,8],
 'measurement.calf-circumference':[158,28,9],'measurement.ankle-circumference':[196,19,7],
 'measurement.foot-circumference':[150,53,12],'measurement.instep-circumference':[129,38,18]
};
function overlayFor(item:AnatomyIllustrationDefinition):string{
 const level=circumferenceLevel[item.canonicalFactId];
 if(!level)return overlayGeometry[item.overlay];
 const [cy,rx,ry]=level;
 return `<ellipse class="anatomy-path anatomy-circumference" cx="120" cy="${cy}" rx="${rx}" ry="${ry}"/><path class="anatomy-hidden-path" d="M${120-rx} ${cy} A${rx} ${ry} 0 0 0 ${120+rx} ${cy}"/><rect class="anatomy-landmark" x="116" y="${cy-4}" width="8" height="8"/>`;
}
export function renderAnatomyIllustration(canonicalFactId:string|undefined):string{
 const item=anatomyIllustrationFor(canonicalFactId); if(!item)return '';
 const titleId=`${item.id}-title`,descId=`${item.id}-desc`;
 return `<figure class="anatomy-figure" data-illustration-id="${item.id}" data-model-family="${item.modelFamilyId}" data-region="${item.region}" data-orientation="${item.orientation}" data-overlay="${item.overlay}"><svg class="anatomy-svg" viewBox="0 0 240 240" role="img" tabindex="-1" aria-labelledby="${titleId} ${descId}" focusable="false"><title id="${titleId}">${e(item.title)}</title><desc id="${descId}">${e(item.description)}</desc><use class="anatomy-model" href="${item.assetRef}#${item.symbolId}"/>${overlayFor(item)}</svg><figcaption>${e(item.caption)}</figcaption><p class="anatomy-key"><span class="key-solid">Solid path with different end shapes</span><span class="key-dashed">Dashed closed path</span><span class="key-landmark">Square landmark</span></p></figure>`;
}
