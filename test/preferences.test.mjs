import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountApp } from '../dist/app/app.js';
import { resolveTheme } from '../dist/lib/preferences.js';

class FakeControl {
  constructor(root, kind, attributes, text = '') {
    this.root = root;
    this.kind = kind;
    this.attributes = attributes;
    this.textContent = text;
    this.dataset = attributes.route ? { route: attributes.route } : {};
    this.value = attributes.value ?? '';
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  dispatch(type) {
    const listener = this.listeners.get(type);
    if (listener) listener({ currentTarget: this });
  }

  click() {
    this.dispatch(this.kind === 'input' ? 'change' : 'click');
  }
}

class FakeRoot {
  constructor() {
    this.html = '';
    this.boundControls = new Map();
  }

  set innerHTML(value) {
    this.html = value;
    this.boundControls = new Map();
  }

  get innerHTML() {
    return this.html;
  }

  get textContent() {
    return this.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  querySelectorAll(selector) {
    if (this.boundControls.has(selector)) return this.boundControls.get(selector);
    if (selector === '[data-route]') return this.navigationButtons(selector);
    if (selector === 'input[name="theme"]') return this.themeInputs(selector);
    return [];
  }

  navigationButtons(selector) {
    const controls = [];
    const regex = /<button([^>]*)>([\s\S]*?)<\/button>/g;
    let match;
    while ((match = regex.exec(this.html)) !== null) {
      const attributes = parseAttributes(match[1]);
      if (!attributes.route) continue;
      controls.push(new FakeControl(this, 'button', attributes, stripTags(match[2])));
    }
    this.boundControls.set(selector, controls);
    return controls;
  }

  themeInputs(selector) {
    const controls = [];
    const regex = /<input([^>]*)>/g;
    let match;
    while ((match = regex.exec(this.html)) !== null) {
      const attributes = parseAttributes(match[1]);
      if (attributes.name !== 'theme') continue;
      controls.push(new FakeControl(this, 'input', attributes));
    }
    this.boundControls.set(selector, controls);
    return controls;
  }
}

function parseAttributes(source) {
  const attributes = {};
  const normalized = source.replace(/data-route=/g, 'route=');
  const regex = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    attributes[match[1]] = match[2];
  }
  return attributes;
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    clear: () => values.clear(),
  };
}

function setupApp() {
  const root = new FakeRoot();
  globalThis.localStorage = createStorage();
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.document = { documentElement: { dataset: {} } };
  mountApp(root);
  return root;
}

function clickRoute(root, route) {
  const button = root.querySelectorAll('[data-route]').find((control) => control.dataset.route === route);
  assert.ok(button, `Expected ${route} navigation button`);
  button.click();
}

function chooseTheme(root, value) {
  const input = root.querySelectorAll('input[name="theme"]').find((control) => control.value === value);
  assert.ok(input, `Expected ${value} theme input`);
  input.click();
}

test('theme resolution is deterministic', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
});

test('application shell renders and primary navigation reaches every destination', () => {
  const root = setupApp();
  assert.match(root.textContent, /Sigma/);
  assert.match(root.textContent, /Start with people, not accounts/);

  const expectations = [
    ['profiles', /Start with people, not accounts/],
    ['measurements', /Keep the sizes you rarely need/],
    ['family', /Connection will never mean automatic access/],
    ['privacy', /Private by foundation, not by theatre/],
    ['settings', /Theme preference/],
  ];

  for (const [route, expectedText] of expectations) {
    clickRoute(root, route);
    assert.match(root.textContent, expectedText);
  }
});

test('theme controls select system, light and dark and persist preference', () => {
  const root = setupApp();
  clickRoute(root, 'settings');

  chooseTheme(root, 'dark');
  assert.equal(globalThis.localStorage.getItem('sigma.themePreference'), 'dark');
  assert.equal(globalThis.document.documentElement.dataset.theme, 'dark');

  chooseTheme(root, 'light');
  assert.equal(globalThis.localStorage.getItem('sigma.themePreference'), 'light');
  assert.equal(globalThis.document.documentElement.dataset.theme, 'light');

  chooseTheme(root, 'system');
  assert.equal(globalThis.localStorage.getItem('sigma.themePreference'), 'system');
  assert.equal(globalThis.document.documentElement.dataset.theme, 'light');
});

test('source contract still excludes later-ticket behaviours', () => {
  const source = readFileSync('src/app/content.ts', 'utf8');
  for (const text of ['Profiles', 'Measurements & Sizes', 'Family', 'Privacy', 'Settings', 'No recommendation logic', 'No runtime permissions']) {
    assert.match(source, new RegExp(text.replace(/[&]/g, '\\&')));
  }
});
