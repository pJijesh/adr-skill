// Generates the per-agent adapters from skills/adr/core.md.
// Run: node scripts/build.mjs   Check only: node scripts/build.mjs --check
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(ROOT, 'skills', 'adr');
export const BLOCK_START = '<!-- adr:start -->';
export const BLOCK_END = '<!-- adr:end -->';
const core = readFileSync(join(SKILL, 'core.md'), 'utf8').trimEnd() + '\n';

export function cursorRule() {
  return `---
description: Write, review, supersede and index Architecture Decision Records, with a linter for the decision log
globs:
alwaysApply: false
---

# Architecture decision records

${core}`;
}

export function agentsBlock() {
  return `${BLOCK_START}
## Architecture decision records

Use when asked to record, review, supersede or index an architecture decision.

${core.trimEnd()}
${BLOCK_END}
`;
}

export function outputs() {
  return {
    [join(ROOT, 'adapters', 'cursor', 'adr.mdc')]: cursorRule(),
    [join(ROOT, 'adapters', 'AGENTS.block.md')]: agentsBlock(),
  };
}

export function main(argv) {
  const check = argv.includes('--check');
  let stale = 0;
  for (const [path, text] of Object.entries(outputs())) {
    const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (current === text) continue;
    if (check) { console.error(`stale: ${path.slice(ROOT.length + 1)}`); stale += 1; continue; }
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    console.log(`wrote ${path.slice(ROOT.length + 1)}`);
  }
  if (check) console.log(stale ? `${stale} generated file(s) out of date; run: node scripts/build.mjs` : 'generated files are current');
  return stale ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
