import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from '../dist/lib/preferences.js';
import { readFileSync } from 'node:fs';

test('theme resolution is deterministic', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
});

test('shell source contains all primary destinations and truthful empty states', () => {
  const source = readFileSync('src/app/app.ts', 'utf8');
  for (const text of ['Profiles', 'Measurements & Sizes', 'Family', 'Privacy', 'Settings', 'No recommendation logic', 'No runtime permissions']) {
    assert.match(source, new RegExp(text.replace(/[&]/g, '\\&')));
  }
});
