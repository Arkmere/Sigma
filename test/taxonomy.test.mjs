import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, measurementOptions } from '../dist/domain/taxonomy.js';
test('expanded taxonomy preserves twelve categories and practical representative options', () => {
  assert.equal(categories.length, 12); assert.ok(categories.includes('Custom'));
  for (const [category, option] of [['Upper body', 'Underbust'], ['Lower body', 'Back rise'], ['Feet', 'Ball girth'], ['Clothing', 'Uniform/workwear size'], ['Sports equipment', 'Climbing harness size'], ['Specialist wearables', 'Respirator mask size'], ['Custom', 'Other recorded fit fact']]) assert.ok(measurementOptions[category].includes(option));
});
