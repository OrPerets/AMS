#!/usr/bin/env node

/**
 * Feature Migration Helper Script
 *
 * Assists with migrating page-centric code to the feature folder architecture.
 *
 * Usage:
 *   node scripts/migrate-to-features.mjs [command] [options]
 *
 * Commands:
 *   scaffold <domain>    Create feature folder structure for a domain
 *   audit                Report files that should be migrated
 *   validate             Check for import boundary violations
 */

import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';

const FRONTEND_ROOT = resolve(import.meta.dirname, '..', 'apps', 'frontend');
const FEATURES_DIR = join(FRONTEND_ROOT, 'features');
const SHARED_DIR = join(FRONTEND_ROOT, 'shared');

const FEATURE_SUBDIRS = ['api', 'model', 'ui', 'hooks', 'tests'];

const KNOWN_DOMAINS = [
  'tickets', 'buildings', 'maintenance', 'payments', 'home',
  'notifications', 'gardens', 'admin', 'resident', 'communications',
  'settings', 'documents', 'assets', 'vendors', 'schedules',
  'votes', 'work-orders', 'support', 'operations',
];

function scaffoldFeature(domain) {
  const featureDir = join(FEATURES_DIR, domain);

  if (existsSync(featureDir)) {
    console.log(`  Feature folder already exists: features/${domain}/`);
  } else {
    mkdirSync(featureDir, { recursive: true });
    console.log(`  Created: features/${domain}/`);
  }

  for (const subdir of FEATURE_SUBDIRS) {
    const subdirPath = join(featureDir, subdir);
    if (!existsSync(subdirPath)) {
      mkdirSync(subdirPath, { recursive: true });
      console.log(`  Created: features/${domain}/${subdir}/`);
    }
  }

  const indexPath = join(featureDir, 'index.ts');
  if (!existsSync(indexPath)) {
    writeFileSync(indexPath, `// Public API for ${domain} feature\n// Export types, hooks, and components that other features may consume\n`);
    console.log(`  Created: features/${domain}/index.ts (barrel)`);
  }

  console.log(`\n  Feature "${domain}" scaffolded successfully.`);
}

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

function getFileSize(filePath) {
  return statSync(filePath).size;
}

function countLines(filePath) {
  return readFileSync(filePath, 'utf-8').split('\n').length;
}

function auditFiles() {
  console.log('\n=== File Audit Report ===\n');

  const LARGE_FILE_THRESHOLD = 300;

  const dirs = ['pages', 'components', 'lib'].map((d) => join(FRONTEND_ROOT, d));
  const allFiles = dirs.flatMap(collectTsFiles);

  const largeFiles = [];
  const featureCandidates = new Map();

  for (const file of allFiles) {
    const lines = countLines(file);
    const relPath = relative(FRONTEND_ROOT, file);

    if (lines > LARGE_FILE_THRESHOLD) {
      largeFiles.push({ path: relPath, lines });
    }

    for (const domain of KNOWN_DOMAINS) {
      if (relPath.toLowerCase().includes(domain.replace('-', ''))) {
        if (!featureCandidates.has(domain)) featureCandidates.set(domain, []);
        featureCandidates.get(domain).push({ path: relPath, lines });
      }
    }
  }

  if (largeFiles.length) {
    console.log(`Files exceeding ${LARGE_FILE_THRESHOLD} lines (split candidates):`);
    largeFiles.sort((a, b) => b.lines - a.lines);
    for (const f of largeFiles) {
      console.log(`  ${f.lines.toString().padStart(5)} lines  ${f.path}`);
    }
  }

  console.log('\nDomain-grouped migration candidates:');
  for (const [domain, files] of featureCandidates.entries()) {
    const featureExists = existsSync(join(FEATURES_DIR, domain, 'index.ts'));
    const status = featureExists ? '✓ scaffolded' : '○ pending';
    console.log(`\n  ${domain} [${status}]`);
    for (const f of files) {
      console.log(`    ${f.lines.toString().padStart(5)} lines  ${f.path}`);
    }
  }
}

function validateBoundaries() {
  console.log('\n=== Import Boundary Validation ===\n');

  const featureFiles = collectTsFiles(FEATURES_DIR);
  const sharedFiles = collectTsFiles(SHARED_DIR);
  let violations = 0;

  for (const file of sharedFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = relative(FRONTEND_ROOT, file);
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content))) {
      const importPath = match[1];
      if (importPath.includes('/features/')) {
        console.log(`  VIOLATION: ${relPath} imports from features: ${importPath}`);
        violations++;
      }
    }
  }

  for (const file of featureFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = relative(FRONTEND_ROOT, file);
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content))) {
      const importPath = match[1];
      const deepFeatureImport = importPath.match(/features\/([^/]+)\/(api|model|ui|hooks)\//);
      if (deepFeatureImport) {
        const importedFeature = deepFeatureImport[1];
        const thisFeature = relPath.match(/features\/([^/]+)\//)?.[1];
        if (importedFeature !== thisFeature) {
          console.log(`  VIOLATION: ${relPath} deep-imports from features/${importedFeature}: ${importPath}`);
          violations++;
        }
      }
    }
  }

  if (violations === 0) {
    console.log('  No boundary violations found.');
  } else {
    console.log(`\n  Found ${violations} violation(s).`);
  }
  return violations;
}

// CLI handler
const [, , command, ...args] = process.argv;

switch (command) {
  case 'scaffold': {
    const domain = args[0];
    if (!domain) {
      console.error('Usage: migrate-to-features.mjs scaffold <domain>');
      console.error(`Known domains: ${KNOWN_DOMAINS.join(', ')}`);
      process.exit(1);
    }
    console.log(`\nScaffolding feature: ${domain}`);
    scaffoldFeature(domain);
    break;
  }
  case 'audit':
    auditFiles();
    break;
  case 'validate':
    process.exit(validateBoundaries() > 0 ? 1 : 0);
  default:
    console.log('Feature Migration Helper');
    console.log('');
    console.log('Commands:');
    console.log('  scaffold <domain>  Create feature folder structure');
    console.log('  audit              Report migration candidates');
    console.log('  validate           Check import boundary violations');
    console.log('');
    console.log(`Known domains: ${KNOWN_DOMAINS.join(', ')}`);
}
