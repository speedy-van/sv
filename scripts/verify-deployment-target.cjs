#!/usr/bin/env node
'use strict';

/**
 * verify-deployment-target.cjs
 *
 * Read-only pre-flight check for Vercel deployments.
 * Must pass before running `vercel --prod`.
 *
 * Usage (local):
 *   node scripts/verify-deployment-target.cjs <web|api>
 *
 * Usage (CI — no local .vercel/project.json required):
 *   VERCEL_ORG_ID=<team> VERCEL_PROJECT_ID=<prj> \
 *     node scripts/verify-deployment-target.cjs <web|api>
 *
 * Manually bypassing repository scripts is outside this local safeguard.
 */

const path = require('path');
const fs = require('fs');

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TEAM = 'team_Q9vSLhjMkcmD3pFurpvBUc4R';

const RETIRED_IDS = new Set([
  'prj_03tJLYNkaGYRtFhEnl2rb0Rj7W4Q', // speedy-van-co-uk-web (deleted 2026-09-24)
  'prj_TlgXZMFCOlvfryaZg7e2ASjTIipi', // speedy-van-co-uk-web-v2 (deleted 2026-09-24)
]);

const REPO_ROOT = path.resolve(__dirname, '..');

const TARGETS = {
  web: {
    projectId: 'prj_OkJrabaUpBmsMqNibYZc5cgnIqFg',
    projectName: 'speedy-van-web',
    linkDir: REPO_ROOT,
  },
  api: {
    projectId: 'prj_QjawXiV1uA0WAOB0eb7x379ydY3f',
    projectName: 'speedy-van-api',
    linkDir: path.join(REPO_ROOT, 'apps', 'api'),
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fail(msg) {
  process.stderr.write('\n❌ Deployment target check FAILED\n');
  process.stderr.write('  ' + msg + '\n\n');
  process.exit(1);
}

function pass(msg) {
  process.stdout.write('  ✔ ' + msg + '\n');
}

function readLinkFile(dir) {
  const linkPath = path.join(dir, '.vercel', 'project.json');
  if (!fs.existsSync(linkPath)) return { exists: false, path: linkPath };
  let data;
  try {
    data = JSON.parse(fs.readFileSync(linkPath, 'utf8'));
  } catch (e) {
    fail('Malformed .vercel/project.json at ' + linkPath + ': ' + e.message);
  }
  return { exists: true, path: linkPath, data };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const targetName = process.argv[2];

if (!targetName) {
  fail(
    'No target specified.\n' +
    '  Usage: node scripts/verify-deployment-target.cjs <web|api>'
  );
}

if (!TARGETS[targetName]) {
  fail(
    'Unknown target "' + targetName + '".\n' +
    '  Valid targets: ' + Object.keys(TARGETS).join(', ')
  );
}

const spec = TARGETS[targetName];
process.stdout.write('\nVerifying deployment target: ' + targetName + ' (' + spec.projectName + ')\n');

const envOrgId = process.env.VERCEL_ORG_ID || '';
const envProjectId = process.env.VERCEL_PROJECT_ID || '';
const ciMode = !!(envOrgId && envProjectId);
const partialEnv = !!(envOrgId || envProjectId) && !ciMode;

if (partialEnv) {
  fail(
    'Partial CI override detected: both VERCEL_ORG_ID and VERCEL_PROJECT_ID must ' +
    'be set together, or neither set (local mode).'
  );
}

// ─── CI mode ─────────────────────────────────────────────────────────────────

if (ciMode) {
  process.stdout.write('  Mode: CI (VERCEL_ORG_ID + VERCEL_PROJECT_ID)\n');

  if (RETIRED_IDS.has(envProjectId)) {
    fail(
      'VERCEL_PROJECT_ID "' + envProjectId + '" is a retired (deleted) project.\n' +
      '  Update to an active project ID. See docs/deployment-projects.md.'
    );
  }

  if (envOrgId !== ALLOWED_TEAM) {
    fail(
      'VERCEL_ORG_ID "' + envOrgId + '" does not match allowed team "' + ALLOWED_TEAM + '".'
    );
  }

  if (envProjectId !== spec.projectId) {
    fail(
      'VERCEL_PROJECT_ID "' + envProjectId + '" does not match expected project\n' +
      '  "' + spec.projectId + '" for target "' + targetName + '".\n' +
      '  To deploy ' + targetName + ', use project ID ' + spec.projectId + '.'
    );
  }

  pass('CI env: team=' + envOrgId + ' project=' + envProjectId);

  // Conflict check: if a link file also exists, it must agree
  const link = readLinkFile(spec.linkDir);
  if (link.exists && link.data) {
    if (link.data.projectId && link.data.projectId !== envProjectId) {
      fail(
        'Conflicting override: VERCEL_PROJECT_ID="' + envProjectId +
        '" but ' + link.path + ' has projectId="' + link.data.projectId + '".\n' +
        '  Resolve before deploying.'
      );
    }
    if (link.data.orgId && link.data.orgId !== envOrgId) {
      fail(
        'Conflicting override: VERCEL_ORG_ID="' + envOrgId +
        '" but ' + link.path + ' has orgId="' + link.data.orgId + '".\n' +
        '  Resolve before deploying.'
      );
    }
    pass('Local link file agrees with CI env vars');
  }
}

// ─── Local mode ──────────────────────────────────────────────────────────────

else {
  process.stdout.write('  Mode: local (.vercel/project.json)\n');

  const link = readLinkFile(spec.linkDir);

  if (!link.exists) {
    fail(
      'No .vercel/project.json found at ' + link.path + '.\n' +
      '  Run: vercel link --project ' + spec.projectName + ' --cwd ' + spec.linkDir + '\n' +
      '  Or set VERCEL_ORG_ID + VERCEL_PROJECT_ID for CI mode.'
    );
  }

  const { data } = link;

  if (!data || !data.projectId || !data.orgId) {
    fail(
      'Malformed .vercel/project.json at ' + link.path + ': missing projectId or orgId.'
    );
  }

  if (RETIRED_IDS.has(data.projectId)) {
    fail(
      link.path + ' projectId "' + data.projectId + '" is a retired (deleted) project.\n' +
      '  Re-link: vercel link --project ' + spec.projectName + ' --cwd ' + spec.linkDir + '\n' +
      '  See docs/deployment-projects.md.'
    );
  }

  if (data.orgId !== ALLOWED_TEAM) {
    fail(
      link.path + ' orgId "' + data.orgId + '" does not match allowed team "' + ALLOWED_TEAM + '".'
    );
  }

  if (data.projectId !== spec.projectId) {
    fail(
      link.path + ' projectId "' + data.projectId + '" does not match expected\n' +
      '  "' + spec.projectId + '" for target "' + targetName + '".\n' +
      '  Re-link: vercel link --project ' + spec.projectName + ' --cwd ' + spec.linkDir
    );
  }

  pass('Link file: team=' + data.orgId + ' project=' + data.projectId);
}

process.stdout.write('\n✅ Target "' + targetName + '" verified — ' + spec.projectName + '\n\n');
