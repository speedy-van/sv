#!/usr/bin/env node

import { ESLint } from 'eslint';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const baselinePath = path.resolve(projectRoot, 'eslint-baseline.json');
const cwd = projectRoot;
const hasBaseline = fs.existsSync(baselinePath);

if (!hasBaseline) {
  console.error('[eslint-baseline] Missing baseline file at eslint-baseline.json');
  process.exit(1);
}

const baselineRaw = fs.readFileSync(baselinePath, 'utf-8');
let baselineEntries = [];
try {
  baselineEntries = JSON.parse(baselineRaw);
} catch (error) {
  console.error('[eslint-baseline] Unable to parse baseline JSON:', error);
  process.exit(1);
}

const makeKey = (filePath, message) => {
  const relativePath = path.relative(cwd, filePath).replace(/\\/g, '/');
  const ruleId = message.ruleId || 'no-rule';
  const position = `${message.line}:${message.column}`;
  return `${relativePath}|${ruleId}|${position}|${message.message}`;
};

const baselineMessages = new Set(
  baselineEntries.flatMap((entry) =>
    entry.messages
      .filter((message) => message.severity > 0)
      .map((message) => makeKey(entry.filePath, message)),
  ),
);

const eslint = new ESLint({
  cwd,
  errorOnUnmatchedPattern: false,
  useEslintrc: true,
});

const filterForDisplay = (results, predicate) =>
  results
    .map((result) => {
      const messages = result.messages.filter((message) => predicate(result, message));
      if (!messages.length) {
        return null;
      }
      const warningCount = messages.filter((message) => message.severity === 1).length;
      const errorCount = messages.filter((message) => message.severity === 2).length;
      return {
        ...result,
        messages,
        warningCount,
        errorCount,
        fixableWarningCount: 0,
        fixableErrorCount: 0,
      };
    })
    .filter(Boolean);

const hasBaselineEntry = (result, message) => baselineMessages.has(makeKey(result.filePath, message));

(async () => {
  const results = await eslint.lintFiles(['.']);

  const errors = [];
  const newWarnings = [];

  results.forEach((result) => {
    result.messages.forEach((message) => {
      if (!hasBaselineEntry(result, message)) {
        if (message.severity === 2) {
          errors.push({ result, message });
          return;
        }
        newWarnings.push({ result, message });
      }
    });
  });

  const formatter = await eslint.loadFormatter('stylish');
  const displayResults = filterForDisplay(results, (result, message) => {
    if (message.severity === 2) {
      return true;
    }

    return !hasBaselineEntry(result, message);
  });

  if (displayResults.length) {
    console.log(formatter.format(displayResults));
  }

  if (errors.length || newWarnings.length) {
    if (errors.length) {
      console.error(`[eslint-baseline] Found ${errors.length} error(s).`);
    }
    if (newWarnings.length) {
      console.error(`[eslint-baseline] Found ${newWarnings.length} new warning(s) not in baseline.`);
    }
    process.exit(1);
  }

  console.log('[eslint-baseline] ESLint passed with no new warnings.');
  process.exit(0);
})().catch((error) => {
  console.error('[eslint-baseline] Unexpected failure:', error);
  process.exit(1);
});

