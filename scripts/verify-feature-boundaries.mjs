#!/usr/bin/env node

/**
 * CI Verification Script — Feature Architecture Boundaries
 *
 * Enforces:
 * 1. shared/ does not import from features/
 * 2. Cross-feature imports go through barrel (index.ts) only
 * 3. Feature folders have required structure (index.ts barrel)
 *
 * Exit code 0 = pass, 1 = violations found
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, relative, resolve } from 'path';

const FRONTEND_ROOT = resolve(import.meta.dirname, '..', 'apps', 'frontend');
const FEATURES_DIR = join(FRONTEND_ROOT, 'features');
const SHARED_DIR = join(FRONTEND_ROOT, 'shared');

let totalViolations = 0;
let totalWarnings = 0;

function collectTsFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      results.push(...collectTsFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractImports(content) {
  const imports = [];
  const regex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content))) {
    imports.push(match[1]);
  }
  return imports;
}

function checkSharedDoesNotImportFeatures() {
  console.log('Check 1: shared/ must not import from features/');
  const files = collectTsFiles(SHARED_DIR);
  let violations = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const relPath = relative(FRONTEND_ROOT, file);
    for (const imp of extractImports(content)) {
      if (imp.includes('/features/') || imp.startsWith('features/')) {
        console.log(`  ERROR: ${relPath} -> ${imp}`);
        violations++;
      }
    }
  }

  if (violations === 0) console.log('  PASS');
  totalViolations += violations;
}

function checkCrossFeatureDeepImports() {
  console.log('Check 2: Cross-feature imports must use barrel exports');
  const files = collectTsFiles(FEATURES_DIR);
  let violations = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const relPath = relative(FRONTEND_ROOT, file);
    const thisFeature = relPath.match(/features\/([^/]+)\//)?.[1];

    for (const imp of extractImports(content)) {
      const crossFeature = imp.match(/features\/([^/]+)\/(api|model|ui|hooks|tests)\//);
      if (crossFeature && crossFeature[1] !== thisFeature) {
        console.log(`  ERROR: ${relPath} deep-imports features/${crossFeature[1]}/${crossFeature[2]}/... (use barrel)`);
        violations++;
      }
    }
  }

  if (violations === 0) console.log('  PASS');
  totalViolations += violations;
}

function checkFeatureBarrels() {
  console.log('Check 3: Feature folders must have index.ts barrel');
  if (!existsSync(FEATURES_DIR)) {
    console.log('  SKIP: features/ directory not found');
    return;
  }

  let warnings = 0;
  for (const entry of readdirSync(FEATURES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = join(FEATURES_DIR, entry.name, 'index.ts');
    if (!existsSync(indexPath)) {
      console.log(`  WARN: features/${entry.name}/ missing index.ts barrel`);
      warnings++;
    }
  }

  if (warnings === 0) console.log('  PASS');
  totalWarnings += warnings;
}

console.log('=== Feature Architecture Boundary Check ===\n');
checkSharedDoesNotImportFeatures();
checkCrossFeatureDeepImports();
checkFeatureBarrels();

console.log(`\nResults: ${totalViolations} error(s), ${totalWarnings} warning(s)`);
process.exit(totalViolations > 0 ? 1 : 0);
