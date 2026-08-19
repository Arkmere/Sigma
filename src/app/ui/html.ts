import { categories } from '../../domain/taxonomy.js';
export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
export const field = (data: FormData, name: string) => String(data.get(name) ?? '').trim();
export const today = () => new Date().toISOString().slice(0, 10);
export const header = (kicker: string, title: string, description: string) => `<header class="page-header"><p class="kicker">${escapeHtml(kicker)}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></header>`;
export const empty = (eyebrow: string, title: string, body: string) => `<section class="empty-state"><p class="eyebrow">${escapeHtml(eyebrow)}</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></section>`;
export const disclosure = (summary: string, bodyHtml: string) => `<details><summary>${summary}</summary>${bodyHtml}</details>`;
export const categoryOptions = (selected: string) => categories.map((item) => `<option value="${escapeHtml(item)}" ${item === selected ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('');
export function formatDate(value: string): string { const date = new Date(`${value.slice(0, 10)}T00:00:00`); return Number.isNaN(date.valueOf()) ? escapeHtml(value) : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date); }
export const sourceLabel = (source: string, name?: string) => `${source === 'manual' ? 'Manual' : escapeHtml(source.replaceAll('_', ' '))}${name ? ` · ${escapeHtml(name)}` : ''}`;
// The recorded number is the fact; its unit or sizing system just qualifies it. Wrapping only the
// qualifier (order varies: "91.4 cm" vs "UK 8") lets styles.css keep it visually quieter than the
// value itself, without forcing every call site into one fixed value/unit ordering.
export const unitSpan = (text: string) => `<span class="record-unit">${escapeHtml(text)}</span>`;
