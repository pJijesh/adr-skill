#!/usr/bin/env node
// Architecture Decision Record helper. Zero dependencies.
//   adr.mjs new <dir> "Title" [--date YYYY-MM-DD] [--deciders "Names"]
//   adr.mjs supersede <dir> <number> "New title" [--date YYYY-MM-DD] [--deciders "Names"]
//   adr.mjs status <dir> <number> <proposed|accepted|rejected|deprecated> [--date YYYY-MM-DD]
//   adr.mjs lint <dir> [--strict] [--json] [--today YYYY-MM-DD] [--stale-days N]
//   adr.mjs index <dir> [--out FILE] [--check]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATUSES, listAdrFiles, loadAll, lint, template, setMeta, slugify, pad, isRealDate, indexMarkdown, RULES } from './lib.mjs';

const USAGE = `usage:
  adr.mjs new <dir> "Title" [--date YYYY-MM-DD] [--deciders "Names"]
  adr.mjs supersede <dir> <number> "New title" [--date YYYY-MM-DD] [--deciders "Names"]
  adr.mjs status <dir> <number> <${STATUSES.filter((s) => s !== 'superseded').join('|')}> [--date YYYY-MM-DD]
  adr.mjs lint <dir> [--strict] [--json] [--today YYYY-MM-DD] [--stale-days N]
  adr.mjs index <dir> [--out FILE] [--check]
  adr.mjs rules
exit codes: 0 ok, 1 problems found, 2 usage error`;

const VALUE_FLAGS = new Set(['--date', '--deciders', '--today', '--stale-days', '--out']);

export function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (VALUE_FLAGS.has(a)) { flags[a.slice(2)] = argv[i + 1]; i += 1; } else if (a.startsWith('--')) flags[a.slice(2)] = true;
    else positional.push(a);
  }
  return { flags, positional };
}

const today = () => new Date().toISOString().slice(0, 10);
const nextNumber = (dir) => {
  const nums = loadAll(dir).map((a) => a.number).filter((n) => n !== null);
  return (nums.length ? Math.max(...nums) : 0) + 1;
};
const fileFor = (dir, n) => listAdrFiles(dir).find((f) => f.startsWith(`${pad(n)}-`));

export function run(argv, out = console.log, err = console.error) {
  const { flags, positional } = parseArgs(argv);
  const [cmd, dir, ...rest] = positional;
  if (flags.help || !cmd) { (flags.help ? out : err)(USAGE); return flags.help ? 0 : 2; }
  if (cmd === 'rules') { for (const r of RULES) out(`${r.id}  ${r.severity.padEnd(7)}  ${r.summary}`); return 0; }
  if (!dir) { err(USAGE); return 2; }
  const root = resolve(dir);
  const date = flags.date || today();
  if (flags.date && !isRealDate(flags.date)) { err(`--date must be a real YYYY-MM-DD date, got "${flags.date}"`); return 2; }
  if (cmd === 'new' || cmd === 'supersede') {
    let oldNumber = null;
    let title;
    if (cmd === 'new') title = rest[0];
    else { oldNumber = Number(rest[0]); title = rest[1]; }
    if (!title || (cmd === 'supersede' && !Number.isInteger(oldNumber))) { err(USAGE); return 2; }
    if (!existsSync(root)) mkdirSync(root, { recursive: true });
    let oldFile = null;
    if (oldNumber !== null) {
      oldFile = fileFor(root, oldNumber);
      if (!oldFile) { err(`no ADR numbered ${pad(oldNumber)} in ${dir}`); return 1; }
    }
    const number = nextNumber(root);
    const file = `${pad(number)}-${slugify(title)}.md`;
    let text = template({ number, title, date, deciders: flags.deciders });
    if (oldNumber !== null) {
      text = setMeta(text, 'Supersedes', pad(oldNumber));
      const oldPath = join(root, oldFile);
      let old = setMeta(readFileSync(oldPath, 'utf8'), 'Status', 'superseded');
      old = setMeta(old, 'Superseded by', pad(number));
      writeFileSync(oldPath, old);
      out(`updated ${oldFile}: status superseded, superseded by ${pad(number)}`);
    }
    writeFileSync(join(root, file), text);
    out(`created ${file}`);
    return 0;
  }
  if (cmd === 'status') {
    const n = Number(rest[0]);
    const status = (rest[1] || '').toLowerCase();
    if (!Number.isInteger(n) || !STATUSES.includes(status)) { err(USAGE); return 2; }
    if (status === 'superseded') { err('use "adr.mjs supersede" so the new ADR and the links are created together'); return 2; }
    const f = fileFor(root, n);
    if (!f) { err(`no ADR numbered ${pad(n)} in ${dir}`); return 1; }
    let text = setMeta(readFileSync(join(root, f), 'utf8'), 'Status', status);
    if (flags.date) text = setMeta(text, 'Date', flags.date);
    writeFileSync(join(root, f), text);
    out(`${f}: status ${status}`);
    return 0;
  }
  if (cmd === 'lint') {
    if (!existsSync(root)) { err(`no such directory: ${dir}`); return 2; }
    const staleDays = flags['stale-days'] === undefined ? 60 : Number(flags['stale-days']);
    if (!Number.isFinite(staleDays) || staleDays < 0) { err('--stale-days must be a non-negative number'); return 2; }
    if (flags.today && !isRealDate(flags.today)) { err('--today must be a real YYYY-MM-DD date'); return 2; }
    const result = lint(root, { today: flags.today || today(), staleDays });
    const errors = result.findings.filter((f) => f.severity === 'error').length;
    const warnings = result.findings.length - errors;
    if (flags.json) out(JSON.stringify({ adrs: result.count, errors, warnings, findings: result.findings }, null, 2));
    else {
      for (const f of result.findings) out(`${f.file}${f.line ? `:${f.line}` : ''}  ${f.rule}  ${f.severity}  ${f.message}`);
      out(`${result.count} ADR(s): ${errors} error(s), ${warnings} warning(s)`);
    }
    return errors > 0 || (flags.strict && warnings > 0) ? 1 : 0;
  }
  if (cmd === 'index') {
    if (!existsSync(root)) { err(`no such directory: ${dir}`); return 2; }
    const text = indexMarkdown(root);
    if (flags.check) {
      const target = flags.out ? resolve(flags.out) : join(root, 'README.md');
      const current = existsSync(target) ? readFileSync(target, 'utf8') : null;
      if (current === text) { out('index is current'); return 0; }
      err(`index is out of date: ${target}`);
      return 1;
    }
    if (flags.out) { writeFileSync(resolve(flags.out), text); out(`wrote ${flags.out}`); } else process.stdout.write(text);
    return 0;
  }
  err(`unknown command: ${cmd}`);
  err(USAGE);
  return 2;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(run(process.argv.slice(2)));
