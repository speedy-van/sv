#!/usr/bin/env node
'use strict';

/**
 * deployment-target-regression.cjs
 *
 * Isolated fixture tests for verify-deployment-target.cjs.
 * Uses only Node built-ins. No deployment is performed.
 *
 * Usage:
 *   node scripts/deployment-target-regression.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const SCRIPT = path.join(__dirname, 'verify-deployment-target.cjs');
const REPO_ROOT = path.resolve(__dirname, '..');

const VALID_WEB_PROJECT = 'prj_OkJrabaUpBmsMqNibYZc5cgnIqFg';
const VALID_API_PROJECT = 'prj_QjawXiV1uA0WAOB0eb7x379ydY3f';
const VALID_TEAM = 'team_Q9vSLhjMkcmD3pFurpvBUc4R';
const RETIRED_WEB = 'prj_03tJLYNkaGYRtFhEnl2rb0Rj7W4Q';
const RETIRED_V2 = 'prj_TlgXZMFCOlvfryaZg7e2ASjTIipi';
const WRONG_TEAM = 'team_WRONGTEAMID000000000000000';

// ─── Test runner ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function run(label, args, env, expectCode) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    env: { ...env },
    encoding: 'utf8',
  });
  const ok = result.status === expectCode;
  if (ok) {
    process.stdout.write('  PASS  ' + label + '\n');
    passed++;
  } else {
    process.stdout.write('  FAIL  ' + label +
      ' — expected exit ' + expectCode + ', got ' + result.status + '\n');
    if (result.stderr) process.stdout.write('         stderr: ' + result.stderr.trim() + '\n');
    failed++;
  }
}

// Write a temporary .vercel/project.json fixture into a temp dir, run the
// script with FORCE_LINK_DIR env, and clean up afterward.
// verify-deployment-target.cjs uses path.resolve(__dirname, '..') as REPO_ROOT
// so we can't override it without modifying the script. Instead we use
// temporary real link files at the actual repo locations, backing them up first.

function withLinkFile(dir, content, fn) {
  const vercelDir = path.join(dir, '.vercel');
  const linkFile = path.join(vercelDir, 'project.json');
  const backupFile = linkFile + '.regression-backup';

  const hadDir = fs.existsSync(vercelDir);
  const hadFile = fs.existsSync(linkFile);

  if (hadFile) fs.renameSync(linkFile, backupFile);
  else if (!hadDir) fs.mkdirSync(vercelDir, { recursive: true });

  fs.writeFileSync(linkFile, JSON.stringify(content), 'utf8');

  try {
    fn();
  } finally {
    fs.unlinkSync(linkFile);
    if (hadFile) fs.renameSync(backupFile, linkFile);
    else if (!hadDir) fs.rmdirSync(vercelDir, { recursive: true });
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

process.stdout.write('\nRunning deployment-target regression tests...\n\n');
process.stdout.write('--- No-target / unknown-target errors ---\n');

run('rejects missing target',        [],          {},  1);
run('rejects unknown target "ftp"',  ['ftp'],     {},  1);
run('rejects unknown target "web2"', ['web2'],    {},  1);

process.stdout.write('\n--- CI mode: valid configurations ---\n');

run('CI web: valid team + web project',
  ['web'],
  { VERCEL_ORG_ID: VALID_TEAM, VERCEL_PROJECT_ID: VALID_WEB_PROJECT },
  0
);

run('CI api: valid team + api project',
  ['api'],
  { VERCEL_ORG_ID: VALID_TEAM, VERCEL_PROJECT_ID: VALID_API_PROJECT },
  0
);

process.stdout.write('\n--- CI mode: rejected configurations ---\n');

run('CI: rejects retired web project ID',
  ['web'],
  { VERCEL_ORG_ID: VALID_TEAM, VERCEL_PROJECT_ID: RETIRED_WEB },
  1
);

run('CI: rejects retired web-v2 project ID',
  ['web'],
  { VERCEL_ORG_ID: VALID_TEAM, VERCEL_PROJECT_ID: RETIRED_V2 },
  1
);

run('CI: rejects wrong team',
  ['web'],
  { VERCEL_ORG_ID: WRONG_TEAM, VERCEL_PROJECT_ID: VALID_WEB_PROJECT },
  1
);

run('CI: rejects web project ID used for api target',
  ['api'],
  { VERCEL_ORG_ID: VALID_TEAM, VERCEL_PROJECT_ID: VALID_WEB_PROJECT },
  1
);

run('CI: rejects api project ID used for web target',
  ['web'],
  { VERCEL_ORG_ID: VALID_TEAM, VERCEL_PROJECT_ID: VALID_API_PROJECT },
  1
);

run('CI: rejects partial env (org only)',
  ['web'],
  { VERCEL_ORG_ID: VALID_TEAM },
  1
);

run('CI: rejects partial env (project only)',
  ['web'],
  { VERCEL_ORG_ID: '', VERCEL_PROJECT_ID: VALID_WEB_PROJECT },
  1
);

process.stdout.write('\n--- Local mode: valid configurations ---\n');

withLinkFile(
  REPO_ROOT,
  { projectId: VALID_WEB_PROJECT, orgId: VALID_TEAM, projectName: 'speedy-van-web' },
  () => run('Local web: valid link file', ['web'], {}, 0)
);

withLinkFile(
  path.join(REPO_ROOT, 'apps', 'api'),
  { projectId: VALID_API_PROJECT, orgId: VALID_TEAM, projectName: 'speedy-van-api' },
  () => run('Local api: valid link file', ['api'], {}, 0)
);

process.stdout.write('\n--- Local mode: rejected configurations ---\n');

// No link file present (we must not have a real .vercel/project.json at root during this check)
// Only run if there is currently no real link file (avoid clobbering production state)
const webLinkExists = fs.existsSync(path.join(REPO_ROOT, '.vercel', 'project.json'));
if (!webLinkExists) {
  run('Local web: missing link file', ['web'], {}, 1);
  process.stdout.write('  (skipped — real .vercel/project.json present; test cannot safely remove it)\n');
} else {
  process.stdout.write('  SKIP  Local web: missing link file (real link file present — preserved)\n');
}

withLinkFile(
  REPO_ROOT,
  { projectId: RETIRED_WEB, orgId: VALID_TEAM, projectName: 'speedy-van-co-uk-web' },
  () => run('Local web: rejects retired web project ID in link file', ['web'], {}, 1)
);

withLinkFile(
  REPO_ROOT,
  { projectId: RETIRED_V2, orgId: VALID_TEAM, projectName: 'speedy-van-co-uk-web-v2' },
  () => run('Local web: rejects retired v2 project ID in link file', ['web'], {}, 1)
);

withLinkFile(
  REPO_ROOT,
  { projectId: VALID_WEB_PROJECT, orgId: WRONG_TEAM, projectName: 'speedy-van-web' },
  () => run('Local web: rejects wrong team in link file', ['web'], {}, 1)
);

withLinkFile(
  REPO_ROOT,
  { projectId: VALID_API_PROJECT, orgId: VALID_TEAM, projectName: 'speedy-van-api' },
  () => run('Local web: rejects api project ID for web target', ['web'], {}, 1)
);

withLinkFile(
  REPO_ROOT,
  { orgId: VALID_TEAM },
  () => run('Local web: rejects malformed link file (no projectId)', ['web'], {}, 1)
);

process.stdout.write('\n--- CI mode: conflict detection ---\n');

withLinkFile(
  REPO_ROOT,
  { projectId: VALID_API_PROJECT, orgId: VALID_TEAM },
  () => run(
    'CI web: rejects conflicting local link file (api projectId vs web env)',
    ['web'],
    { VERCEL_ORG_ID: VALID_TEAM, VERCEL_PROJECT_ID: VALID_WEB_PROJECT },
    1
  )
);

withLinkFile(
  REPO_ROOT,
  { projectId: VALID_WEB_PROJECT, orgId: VALID_TEAM },
  () => run(
    'CI web: accepts matching local link file',
    ['web'],
    { VERCEL_ORG_ID: VALID_TEAM, VERCEL_PROJECT_ID: VALID_WEB_PROJECT },
    0
  )
);

// ─── Summary ─────────────────────────────────────────────────────────────────

process.stdout.write('\n');
process.stdout.write('Results: ' + passed + ' passed, ' + failed + ' failed\n\n');

if (failed > 0) {
  process.exit(1);
}
