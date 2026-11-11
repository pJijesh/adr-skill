import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lint, parseAdr, slugify, setMeta, indexMarkdown, isRealDate, RULES } from '../skills/adr/scripts/lib.mjs';
import { run, parseArgs } from '../skills/adr/scripts/adr.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(ROOT, 'skills/adr/scripts/adr.mjs');
const EXAMPLE = join(ROOT, 'examples/adr');
const tmp = () => mkdtempSync(join(tmpdir(), 'adr-'));

const GOOD = (n = 1, extra = {}) => `# ${String(n).padStart(4, '0')}. Use queues for emails

- Status: ${extra.status || 'accepted'}
- Date: ${extra.date || '2026-03-01'}
${extra.meta || ''}
## Context

Emails are sent inside the request and slow the checkout.

## Options considered

### Option A: Send inline

Simple. Slows the request.

### Option B: Queue the emails

Adds a queue. Removes the delay.

## Decision

We will queue the emails (Option B).

## Consequences

### Good

- Faster checkout.

### Bad

- One more moving part.

## Review

Revisit in six months.
`;

function logWith(files) {
  const dir = tmp();
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}
const rules = (dir, opts = { today: '2026-03-10' }) => lint(dir, opts).findings.map((f) => f.rule);

test('a well-formed ADR has no findings', () => {
  assert.deepEqual(rules(logWith({ '0001-use-queues-for-emails.md': GOOD() })), []);
});

test('ADR001 bad file name', () => assert.ok(rules(logWith({ 'Queues.md': GOOD() })).includes('ADR001')));
test('README.md and index.md are ignored', () => assert.deepEqual(rules(logWith({ 'README.md': '# x', 'index.md': '# y', '0001-a-b.md': GOOD() })), []));
test('ADR002 duplicate number', () => {
  const r = rules(logWith({ '0001-a.md': GOOD(), '0001-b.md': GOOD() }));
  assert.ok(r.includes('ADR002'));
});
test('ADR003 gap is a warning', () => {
  const dir = logWith({ '0001-a.md': GOOD(1), '0003-b.md': GOOD(3) });
  const f = lint(dir, { today: '2026-03-10' }).findings.find((x) => x.rule === 'ADR003');
  assert.ok(f && f.severity === 'warning');
});
test('ADR004 heading number mismatch', () => assert.ok(rules(logWith({ '0002-a.md': GOOD(1) })).includes('ADR004')));
test('ADR004 heading without a number', () => assert.ok(rules(logWith({ '0001-a.md': GOOD().replace('# 0001. ', '# ') })).includes('ADR004')));
test('ADR005 missing status and date', () => {
  const r = rules(logWith({ '0001-a.md': GOOD().replace('- Status: accepted\n', '').replace('- Date: 2026-03-01\n', '') }));
  assert.equal(r.filter((x) => x === 'ADR005').length, 2);
});
test('ADR006 invalid status', () => assert.ok(rules(logWith({ '0001-a.md': GOOD(1, { status: 'maybe' }) })).includes('ADR006')));
test('ADR007 impossible date', () => assert.ok(rules(logWith({ '0001-a.md': GOOD(1, { date: '2026-02-31' }) })).includes('ADR007')));
test('ADR008 missing section', () => assert.ok(rules(logWith({ '0001-a.md': GOOD().replace('## Context', '## Background') })).includes('ADR008')));
test('ADR009 only one option', () => {
  const t = GOOD().replace(/### Option B[\s\S]*?(?=## Decision)/, '');
  assert.ok(rules(logWith({ '0001-a.md': t })).includes('ADR009'));
});
test('ADR010 decision does not name an option', () => assert.ok(rules(logWith({ '0001-a.md': GOOD().replace('We will queue the emails (Option B).', 'We will do the sensible thing.') })).includes('ADR010')));
test('ADR010 accepts the option name without its label', () => assert.ok(!rules(logWith({ '0001-a.md': GOOD().replace(' (Option B)', '') })).includes('ADR010')));
test('ADR011 no bad consequences', () => assert.ok(rules(logWith({ '0001-a.md': GOOD().replace('- One more moving part.', '') })).includes('ADR011')));
test('ADR011 missing good subsection', () => assert.ok(rules(logWith({ '0001-a.md': GOOD().replace('### Good', '### Notes') })).includes('ADR011')));
test('ADR012 supersedes a missing ADR', () => assert.ok(rules(logWith({ '0002-a.md': GOOD(2, { meta: '- Supersedes: 0001\n' }) })).includes('ADR012')));
test('ADR013 non-reciprocal supersession', () => {
  const dir = logWith({ '0001-a.md': GOOD(1), '0002-b.md': GOOD(2, { meta: '- Supersedes: 0001\n' }) });
  assert.ok(rules(dir).includes('ADR013'));
});
test('ADR014 superseded status without link, and link without status', () => {
  assert.ok(rules(logWith({ '0001-a.md': GOOD(1, { status: 'superseded' }) })).includes('ADR014'));
  const dir = logWith({ '0001-a.md': GOOD(1, { meta: '- Superseded by: 0002\n' }), '0002-b.md': GOOD(2, { meta: '- Supersedes: 0001\n' }) });
  assert.ok(rules(dir).includes('ADR014'));
});
test('ADR015 placeholders, including the unedited template', () => {
  assert.ok(rules(logWith({ '0001-a.md': GOOD().replace('slow the checkout.', 'TODO: say more.') })).includes('ADR015'));
  const dir = tmp();
  run(['new', dir, 'Use queues', '--date', '2026-03-01'], () => {}, () => {});
  assert.ok(rules(dir).includes('ADR015'));
});
test('ADR016 stale proposal uses --today and --stale-days', () => {
  const dir = logWith({ '0001-a.md': GOOD(1, { status: 'proposed', date: '2026-01-01' }) });
  assert.ok(rules(dir, { today: '2026-03-10' }).includes('ADR016'));
  assert.ok(!rules(dir, { today: '2026-03-10', staleDays: 120 }).includes('ADR016'));
});
test('ADR017 no review section', () => assert.ok(rules(logWith({ '0001-a.md': GOOD().replace(/## Review[\s\S]*$/, '') })).includes('ADR017')));
test('ADR018 long title', () => assert.ok(rules(logWith({ '0001-a.md': GOOD().replace('Use queues for emails', 'x'.repeat(90)) })).includes('ADR018')));
test('ADR019 long decision', () => assert.ok(rules(logWith({ '0001-a.md': GOOD().replace('We will queue the emails (Option B).', 'We will queue the emails (Option B). ' + 'word '.repeat(160)) })).includes('ADR019')));
test('ADR020 future date', () => assert.ok(rules(logWith({ '0001-a.md': GOOD(1, { date: '2027-01-01' }) })).includes('ADR020')));

test('every rule in rules.json is exercised above and documented', () => {
  const doc = readFileSync(join(ROOT, 'skills/adr/references/lint-rules.md'), 'utf8');
  const self = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  for (const r of RULES) {
    assert.ok(doc.includes(`| ${r.id} | ${r.severity} |`), `${r.id} documented with its severity`);
    assert.ok(self.includes(`'${r.id}`), `${r.id} has a test`);
  }
});

test('the worked example lints clean and its index is current', () => {
  const r = lint(EXAMPLE, { today: '2026-11-11' });
  assert.equal(r.count, 6);
  assert.deepEqual(r.findings, []);
  assert.equal(readFileSync(join(EXAMPLE, 'README.md'), 'utf8'), indexMarkdown(EXAMPLE));
});

test('parseAdr reads metadata, sections and subsections with line numbers', () => {
  const a = parseAdr(GOOD(), '0001-x.md');
  assert.equal(a.number, 1);
  assert.equal(a.meta.Status, 'accepted');
  assert.equal(a.sections.map((s) => s.name).join('|'), 'Context|Options considered|Decision|Consequences|Review');
  assert.equal(a.sections[1].subs.length, 2);
  assert.ok(a.sections[1].subs[0].line > a.sections[1].line);
});

test('slugify, isRealDate and setMeta behave', () => {
  assert.equal(slugify('Use PostgreSQL, for the Catalogue!'), 'use-postgresql-for-the-catalogue');
  assert.ok(isRealDate('2024-02-29') && !isRealDate('2025-02-29') && !isRealDate('2025-2-3'));
  const t = setMeta(GOOD(), 'Deciders', 'Team');
  assert.ok(t.includes('- Deciders: Team'));
  assert.equal(setMeta(t, 'Deciders', 'Other').match(/Deciders/g).length, 1);
});

test('new numbers the next file and refuses nothing silently', () => {
  const dir = logWith({ '0001-a.md': GOOD(1), '0004-d.md': GOOD(4) });
  const out = [];
  assert.equal(run(['new', dir, 'Adopt Feature Flags', '--date', '2026-03-02'], (m) => out.push(m)), 0);
  assert.ok(existsSync(join(dir, '0005-adopt-feature-flags.md')));
  assert.match(readFileSync(join(dir, '0005-adopt-feature-flags.md'), 'utf8'), /^# 0005\. Adopt Feature Flags\n\n- Status: proposed\n- Date: 2026-03-02\n/);
});

test('supersede links both records and the result passes the link rules', () => {
  const dir = logWith({ '0001-use-queues-for-emails.md': GOOD(1) });
  assert.equal(run(['supersede', dir, '1', 'Use a managed email service', '--date', '2026-04-01'], () => {}), 0);
  const old = readFileSync(join(dir, '0001-use-queues-for-emails.md'), 'utf8');
  assert.match(old, /- Status: superseded/);
  assert.match(old, /- Superseded by: 0002/);
  const created = readFileSync(join(dir, '0002-use-a-managed-email-service.md'), 'utf8');
  assert.match(created, /- Supersedes: 0001/);
  const ids = rules(dir, { today: '2026-04-02' });
  for (const id of ['ADR012', 'ADR013', 'ADR014']) assert.ok(!ids.includes(id), id);
});

test('supersede and status report a missing ADR and bad use', () => {
  const dir = logWith({ '0001-a.md': GOOD(1) });
  const errs = [];
  assert.equal(run(['supersede', dir, '9', 'x'], () => {}, (m) => errs.push(m)), 1);
  assert.equal(run(['status', dir, '9', 'accepted'], () => {}, (m) => errs.push(m)), 1);
  assert.equal(run(['status', dir, '1', 'superseded'], () => {}, (m) => errs.push(m)), 2);
  assert.equal(run(['status', dir, '1', 'bogus'], () => {}, () => {}), 2);
  assert.equal(run(['status', dir, '1', 'deprecated'], () => {}), 0);
  assert.match(readFileSync(join(dir, '0001-a.md'), 'utf8'), /- Status: deprecated/);
});

test('index is deterministic, sorted and checkable', () => {
  const dir = logWith({ '0002-b.md': GOOD(2), '0001-a.md': GOOD(1) });
  const a = indexMarkdown(dir);
  assert.equal(a, indexMarkdown(dir));
  assert.ok(a.indexOf('0001') < a.indexOf('0002'));
  const out = join(dir, 'README.md');
  assert.equal(run(['index', dir, '--out', out], () => {}), 0);
  assert.equal(run(['index', dir, '--check', '--out', out], () => {}), 0);
  writeFileSync(out, 'stale');
  assert.equal(run(['index', dir, '--check', '--out', out], () => {}, () => {}), 1);
});

test('lint exit codes: errors fail, warnings fail only with --strict', () => {
  const errDir = logWith({ '0001-a.md': GOOD(1, { status: 'maybe' }) });
  assert.equal(run(['lint', errDir, '--today', '2026-03-10'], () => {}), 1);
  const warnDir = logWith({ '0001-a.md': GOOD().replace(/## Review[\s\S]*$/, '') });
  assert.equal(run(['lint', warnDir, '--today', '2026-03-10'], () => {}), 0);
  assert.equal(run(['lint', warnDir, '--today', '2026-03-10', '--strict'], () => {}), 1);
});

test('lint --json is valid JSON with counts', () => {
  const dir = logWith({ '0001-a.md': GOOD(1, { status: 'maybe' }) });
  const out = [];
  run(['lint', dir, '--json', '--today', '2026-03-10'], (m) => out.push(m));
  const j = JSON.parse(out.join('\n'));
  assert.equal(j.adrs, 1);
  assert.ok(j.errors >= 1 && Array.isArray(j.findings));
});

test('usage errors exit 2 and --help exits 0', () => {
  const sh = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8' });
  assert.equal(sh().status, 2);
  assert.equal(sh('--help').status, 0);
  assert.equal(sh('frobnicate', '.').status, 2);
  assert.equal(sh('lint', join(tmpdir(), 'does-not-exist-adr')).status, 2);
  assert.equal(sh('lint', EXAMPLE, '--today', 'not-a-date').status, 2);
  assert.equal(sh('new', tmp(), 'x', '--date', '2026-13-01').status, 2);
  assert.equal(sh('rules').status, 0);
});

test('parseArgs keeps the first positional argument', () => {
  const r = parseArgs(['lint', 'docs/adr', '--strict', '--stale-days', '30']);
  assert.deepEqual(r.positional, ['lint', 'docs/adr']);
  assert.equal(r.flags['stale-days'], '30');
  assert.equal(r.flags.strict, true);
});

test('the CLI lints the worked example from the command line', () => {
  const r = spawnSync(process.execPath, [CLI, 'lint', EXAMPLE, '--today', '2026-11-11'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /6 ADR\(s\): 0 error\(s\), 0 warning\(s\)/);
});

test('every example file is listed in the generated index', () => {
  const idx = readFileSync(join(EXAMPLE, 'README.md'), 'utf8');
  for (const f of readdirSync(EXAMPLE).filter((n) => /^\d{4}-/.test(n))) assert.ok(idx.includes(f), f);
});

test('README rule counts match rules.json', () => {
  const r = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const errors = RULES.filter((x) => x.severity === 'error').length;
  const warnings = RULES.length - errors;
  assert.ok(r.includes(`${RULES.length} rules** (${errors} errors, ${warnings} warnings)`));
  assert.ok(r.includes(`${RULES.length} lint rules`) || r.includes(`each of the ${RULES.length} lint rules`));
});
