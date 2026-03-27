#!/usr/bin/env node

/**
 * Sprint 7 — Performance Budget Checker
 *
 * Validates bundle sizes and page weight budgets for the frontend build.
 * Designed to run in CI after `npm run build` in apps/frontend.
 *
 * Exit code 0 = all budgets pass, 1 = budget exceeded
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const FRONTEND_ROOT = resolve(import.meta.dirname, '..', 'apps', 'frontend');
const NEXT_DIR = join(FRONTEND_ROOT, '.next');

const BUDGETS = {
  totalJsBundleKb: 500,
  maxSingleChunkKb: 250,
  totalCssBundleKb: 100,
  maxFirstLoadChunks: 15,
};

let violations = 0;

function getFileSizesRecursive(dir, ext) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFileSizesRecursive(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      const stats = statSync(fullPath);
      files.push({ path: fullPath, sizeKb: stats.size / 1024 });
    }
  }
  return files;
}

function checkBudget(label, actual, budget, unit = 'KB') {
  const passed = actual <= budget;
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`  [${status}] ${label}: ${actual.toFixed(1)}${unit} (budget: ${budget}${unit})`);
  if (!passed) violations++;
}

console.log('=== Frontend Performance Budget Check ===\n');

const staticDir = join(NEXT_DIR, 'static');
if (!existsSync(staticDir)) {
  console.log('WARNING: .next/static not found. Run `npm run build` in apps/frontend first.');
  console.log('Skipping bundle size checks.\n');
} else {
  const jsFiles = getFileSizesRecursive(staticDir, '.js');
  const cssFiles = getFileSizesRecursive(staticDir, '.css');

  const totalJsKb = jsFiles.reduce((sum, f) => sum + f.sizeKb, 0);
  const totalCssKb = cssFiles.reduce((sum, f) => sum + f.sizeKb, 0);
  const maxChunkKb = jsFiles.length > 0 ? Math.max(...jsFiles.map((f) => f.sizeKb)) : 0;

  console.log(`Found ${jsFiles.length} JS chunks, ${cssFiles.length} CSS files\n`);

  checkBudget('Total JS bundle size', totalJsKb, BUDGETS.totalJsBundleKb);
  checkBudget('Largest JS chunk', maxChunkKb, BUDGETS.maxSingleChunkKb);
  checkBudget('Total CSS bundle size', totalCssKb, BUDGETS.totalCssBundleKb);
  checkBudget('First-load JS chunks', jsFiles.length, BUDGETS.maxFirstLoadChunks, ' chunks');

  if (jsFiles.length > 0) {
    console.log('\n  Top 5 largest JS chunks:');
    jsFiles
      .sort((a, b) => b.sizeKb - a.sizeKb)
      .slice(0, 5)
      .forEach((f, i) => {
        const relPath = f.path.replace(NEXT_DIR, '.next');
        console.log(`    ${i + 1}. ${relPath} (${f.sizeKb.toFixed(1)}KB)`);
      });
  }
}

console.log(`\nResults: ${violations} budget violation(s)`);
process.exit(violations > 0 ? 1 : 0);
