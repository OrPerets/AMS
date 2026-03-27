#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const i18nPath = path.join(repoRoot, 'apps/frontend/lib/i18n.ts');
const source = fs.readFileSync(i18nPath, 'utf8');

const localeMetaBlock = source.match(/export const localeMeta:[\s\S]*?};\n\nexport const regionalFormats/);
if (!localeMetaBlock) {
  throw new Error('Could not locate localeMeta block in i18n.ts');
}

if (!localeMetaBlock[0].includes("he:") || !localeMetaBlock[0].includes("direction: 'rtl'")) {
  throw new Error('Hebrew locale must include RTL direction metadata');
}

if (!localeMetaBlock[0].includes("en:") || !localeMetaBlock[0].includes("direction: 'ltr'")) {
  throw new Error('English locale must include LTR direction metadata');
}

const translationsStart = source.indexOf('export const translations');
const heStart = source.indexOf('he: {', translationsStart);
const enStart = source.indexOf('en: {', heStart + 1);
if (translationsStart === -1 || heStart === -1 || enStart === -1) {
  throw new Error('Could not parse translation dictionaries for he/en');
}

const extractKeys = (block) =>
  [...block.matchAll(/'((?:nav|bottomNav)\.[^']+)'\s*:/g)].map((match) => match[1]).sort();

const heKeys = new Set(extractKeys(source.slice(heStart, enStart)));
const enKeys = new Set(extractKeys(source.slice(enStart)));

const missingInEn = [...heKeys].filter((key) => !enKeys.has(key));
const missingInHe = [...enKeys].filter((key) => !heKeys.has(key));

if (missingInEn.length || missingInHe.length) {
  throw new Error(
    `Navigation translation keys mismatch.\nMissing in en: ${missingInEn.join(', ') || 'none'}\nMissing in he: ${missingInHe.join(', ') || 'none'}`,
  );
}

console.log(
  `Sprint 4 navigation validation passed: ${heKeys.size} nav/bottomNav keys aligned across he/en with RTL/LTR metadata.`,
);
