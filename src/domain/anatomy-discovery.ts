import { anatomyIllustrationFor } from './anatomy.js';
import { canonicalFactDefinitions, type AnatomyPath, type CanonicalFactDefinition } from './canonical-facts.js';
import { measurementGuidanceFor } from './measurement-guidance.js';

const samePath = (left: readonly string[], right: readonly string[]): boolean =>
  left.length === right.length && left.every((segment, index) => segment === right[index]);

/** Measurements are discoverable only when all three existing registries support them. */
export const anatomyDiscoverableFacts = (): readonly CanonicalFactDefinition[] =>
  canonicalFactDefinitions.filter((fact) => fact.recordKind === 'measurement'
    && !!fact.anatomyPath
    && !!measurementGuidanceFor(fact.id)
    && !!anatomyIllustrationFor(fact.id));

export const anatomyFactsAtPath = (path: AnatomyPath): readonly CanonicalFactDefinition[] =>
  anatomyDiscoverableFacts().filter((fact) => samePath(fact.anatomyPath!, path));

export const anatomyChildRegions = (path: AnatomyPath): readonly AnatomyPath[] => {
  const children = new Map<string, AnatomyPath>();
  for (const fact of anatomyDiscoverableFacts()) {
    const factPath = fact.anatomyPath!;
    if (factPath.length <= path.length || !path.every((segment, index) => factPath[index] === segment)) continue;
    const child = factPath.slice(0, path.length + 1) as unknown as AnatomyPath;
    children.set(child.join('\u0000'), child);
  }
  return [...children.values()];
};

export const anatomyPathKey = (path: AnatomyPath): string => path.join(' > ');
