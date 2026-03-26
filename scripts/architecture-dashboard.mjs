#!/usr/bin/env node

/**
 * Sprint 8 — Architecture Dashboard
 *
 * Monitors codebase health metrics:
 * - File complexity (line counts per file)
 * - Feature boundary violations
 * - Large file detection
 * - Import dependency analysis
 *
 * Exit code 0 = healthy, 1 = thresholds exceeded
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, relative, resolve } from 'path';

const WORKSPACE_ROOT = resolve(import.meta.dirname, '..');
const FRONTEND_ROOT = join(WORKSPACE_ROOT, 'apps', 'frontend');
const BACKEND_ROOT = join(WORKSPACE_ROOT, 'apps', 'backend');
const REPORTS_DIR = join(WORKSPACE_ROOT, 'reports', 'sprint-8');

const THRESHOLDS = {
  maxFileLines: 400,
  maxTotalFrontendFiles: 300,
  maxFeatureFoldersMissing: 0,
  maxBoundaryViolations: 0,
  maxLargeFiles: 10,
};

let totalWarnings = 0;
let totalErrors = 0;

function collectFiles(dir, extensions) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', '.git'].includes(entry.name)) continue;
      results.push(...collectFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

function countLines(filePath) {
  try {
    return readFileSync(filePath, 'utf-8').split('\n').length;
  } catch {
    return 0;
  }
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

function analyzeFileComplexity() {
  console.log('\n== File Complexity Analysis ==\n');
  const frontendFiles = collectFiles(join(FRONTEND_ROOT, 'pages'), ['.ts', '.tsx'])
    .concat(collectFiles(join(FRONTEND_ROOT, 'components'), ['.ts', '.tsx']))
    .concat(collectFiles(join(FRONTEND_ROOT, 'features'), ['.ts', '.tsx']))
    .concat(collectFiles(join(FRONTEND_ROOT, 'lib'), ['.ts', '.tsx']))
    .concat(collectFiles(join(FRONTEND_ROOT, 'shared'), ['.ts', '.tsx']));

  const fileMetrics = frontendFiles.map((f) => ({
    path: relative(WORKSPACE_ROOT, f),
    lines: countLines(f),
  }));

  const largeFiles = fileMetrics
    .filter((f) => f.lines > THRESHOLDS.maxFileLines)
    .sort((a, b) => b.lines - a.lines);

  console.log(`Total frontend source files: ${fileMetrics.length}`);
  console.log(`Files exceeding ${THRESHOLDS.maxFileLines} lines: ${largeFiles.length}`);

  if (largeFiles.length > 0) {
    console.log('\nLarge files:');
    for (const f of largeFiles) {
      console.log(`  ${f.path}: ${f.lines} lines`);
    }
  }

  if (largeFiles.length > THRESHOLDS.maxLargeFiles) {
    console.log(`\nERROR: ${largeFiles.length} large files exceed threshold of ${THRESHOLDS.maxLargeFiles}`);
    totalErrors++;
  }

  return { fileMetrics, largeFiles };
}

function analyzeFeatureBoundaries() {
  console.log('\n== Feature Boundary Analysis ==\n');
  const featuresDir = join(FRONTEND_ROOT, 'features');
  const sharedDir = join(FRONTEND_ROOT, 'shared');

  if (!existsSync(featuresDir)) {
    console.log('SKIP: features/ directory not found');
    return { violations: 0, missingBarrels: 0 };
  }

  let violations = 0;
  let missingBarrels = 0;

  for (const entry of readdirSync(featuresDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = join(featuresDir, entry.name, 'index.ts');
    if (!existsSync(indexPath)) {
      console.log(`  WARN: features/${entry.name}/ missing index.ts barrel`);
      missingBarrels++;
      totalWarnings++;
    }
  }

  const sharedFiles = collectFiles(sharedDir, ['.ts', '.tsx']);
  for (const file of sharedFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = relative(FRONTEND_ROOT, file);
    for (const imp of extractImports(content)) {
      if (imp.includes('/features/') || imp.startsWith('features/')) {
        console.log(`  ERROR: ${relPath} imports from features/ (${imp})`);
        violations++;
        totalErrors++;
      }
    }
  }

  const featureFiles = collectFiles(featuresDir, ['.ts', '.tsx']);
  for (const file of featureFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = relative(FRONTEND_ROOT, file);
    const thisFeature = relPath.match(/features\/([^/]+)\//)?.[1];

    for (const imp of extractImports(content)) {
      const crossFeature = imp.match(/features\/([^/]+)\/(api|model|ui|hooks|tests)\//);
      if (crossFeature && crossFeature[1] !== thisFeature) {
        console.log(`  ERROR: ${relPath} deep-imports features/${crossFeature[1]}/${crossFeature[2]}/`);
        violations++;
        totalErrors++;
      }
    }
  }

  console.log(`\nBoundary violations: ${violations}`);
  console.log(`Missing barrels: ${missingBarrels}`);

  return { violations, missingBarrels };
}

function analyzeBackendModules() {
  console.log('\n== Backend Module Analysis ==\n');
  const srcDir = join(BACKEND_ROOT, 'src');
  if (!existsSync(srcDir)) {
    console.log('SKIP: backend src/ directory not found');
    return { moduleCount: 0, totalFiles: 0 };
  }

  const allFiles = collectFiles(srcDir, ['.ts']);
  const modules = allFiles.filter((f) => f.endsWith('.module.ts'));

  console.log(`Backend modules: ${modules.length}`);
  console.log(`Total backend source files: ${allFiles.length}`);

  const largeBackendFiles = allFiles
    .map((f) => ({ path: relative(WORKSPACE_ROOT, f), lines: countLines(f) }))
    .filter((f) => f.lines > THRESHOLDS.maxFileLines)
    .sort((a, b) => b.lines - a.lines);

  if (largeBackendFiles.length > 0) {
    console.log(`\nLarge backend files (>${THRESHOLDS.maxFileLines} lines):`);
    for (const f of largeBackendFiles.slice(0, 10)) {
      console.log(`  ${f.path}: ${f.lines} lines`);
    }
  }

  return { moduleCount: modules.length, totalFiles: allFiles.length };
}

function generateDashboardReport(fileAnalysis, boundaryAnalysis, backendAnalysis) {
  mkdirSync(REPORTS_DIR, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    frontend: {
      totalSourceFiles: fileAnalysis.fileMetrics.length,
      largeFileCount: fileAnalysis.largeFiles.length,
      largeFiles: fileAnalysis.largeFiles.slice(0, 20),
      avgLinesPerFile: Math.round(
        fileAnalysis.fileMetrics.reduce((sum, f) => sum + f.lines, 0) / Math.max(fileAnalysis.fileMetrics.length, 1),
      ),
    },
    boundaries: {
      violations: boundaryAnalysis.violations,
      missingBarrels: boundaryAnalysis.missingBarrels,
    },
    backend: backendAnalysis,
    thresholds: THRESHOLDS,
    health: {
      errors: totalErrors,
      warnings: totalWarnings,
      status: totalErrors > 0 ? 'unhealthy' : totalWarnings > 0 ? 'degraded' : 'healthy',
    },
  };

  const reportPath = join(REPORTS_DIR, 'architecture-dashboard.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nDashboard report written to: ${relative(WORKSPACE_ROOT, reportPath)}`);

  return report;
}

console.log('=== Architecture Dashboard ===');
console.log(`Workspace: ${WORKSPACE_ROOT}`);
console.log(`Generated: ${new Date().toISOString()}`);

const fileAnalysis = analyzeFileComplexity();
const boundaryAnalysis = analyzeFeatureBoundaries();
const backendAnalysis = analyzeBackendModules();
const report = generateDashboardReport(fileAnalysis, boundaryAnalysis, backendAnalysis);

console.log('\n== Summary ==');
console.log(`Status: ${report.health.status}`);
console.log(`Errors: ${totalErrors}, Warnings: ${totalWarnings}`);

process.exit(totalErrors > 0 ? 1 : 0);
