import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { anatomyAnchors, anatomyIllustrations, anatomyIllustrationFor, anatomyModelFamilyIds, anatomyOrientations, anatomyRegionIds, overlayTypes } from '../dist/domain/anatomy.js';
import { canonicalFactById } from '../dist/domain/canonical-facts.js';
import { priorityGuidanceIds } from '../dist/domain/measurement-guidance.js';
import { renderAnatomyIllustration } from '../dist/app/ui/anatomy-illustration.js';

test('anatomy registry is typed, unique, local and covers all 35 guided facts',async()=>{
 assert.equal(anatomyIllustrations.length,35); assert.equal(new Set(anatomyIllustrations.map(x=>x.id)).size,35);
 await access(new URL('../src/assets/anatomy-model.svg',import.meta.url));
 const asset=await readFile(new URL('../src/assets/anatomy-model.svg',import.meta.url),'utf8');
 for(const item of anatomyIllustrations){assert.ok(anatomyModelFamilyIds.includes(item.modelFamilyId));assert.ok(anatomyRegionIds.includes(item.region));assert.ok(anatomyOrientations.includes(item.orientation));assert.ok(overlayTypes.includes(item.overlay));assert.equal(item.assetRef,'/anatomy-model.svg');assert.ok(canonicalFactById(item.canonicalFactId));assert.ok(item.anchors.every(anchor=>anchor in anatomyAnchors));assert.match(asset,new RegExp(`id=["']${item.symbolId}["']`));}
 assert.deepEqual(new Set(anatomyIllustrations.map(x=>x.canonicalFactId)),new Set(priorityGuidanceIds));
});
test('resolution is deterministic and never maps custom or legacy text',()=>{assert.equal(anatomyIllustrationFor('measurement.waist-circumference')?.orientation,'front');assert.equal(anatomyIllustrationFor('Waist circumference'),undefined);assert.equal(anatomyIllustrationFor(undefined),undefined);});
test('rendering supplies meaningful non-focusable SVG text and colour-independent grammar',()=>{const html=renderAnatomyIllustration('measurement.shoulder-width');assert.match(html,/role="img"/);assert.match(html,/tabindex="-1"/);assert.match(html,/<title[^>]*>Shoulder width/);assert.match(html,/<desc[^>]*>Back torso/);assert.match(html,/anatomy-start/);assert.match(html,/anatomy-end/);assert.match(html,/Solid path with different end shapes/);assert.equal(renderAnatomyIllustration('custom.waist'), '');});
