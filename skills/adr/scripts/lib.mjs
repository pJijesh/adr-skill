// Parsing, linting and writing for Architecture Decision Records. Zero dependencies.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const STATUSES = ['proposed', 'accepted', 'rejected', 'deprecated', 'superseded'];
export const REQUIRED_SECTIONS = ['Context', 'Options considered', 'Decision', 'Consequences'];
export const FILE_RE = /^(\d{4})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
export const META_KEYS = ['Status', 'Date', 'Deciders', 'Supersedes', 'Superseded by'];

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

export function pad(n) {
  return String(n).padStart(4, '0');
}

export function listAdrFiles(dir) {
  return readdirSync(dir)
    .filter((n) => n.endsWith('.md') && !['README.md', 'index.md'].includes(n))
    .sort();
}

export function isRealDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function parseAdr(text, file) {
  const lines = text.split('\n');
  const m = FILE_RE.exec(file);
  const adr = { file, number: m ? Number(m[1]) : null, headingNumber: null, title: '', meta: {}, metaLines: {}, sections: [], lines };
  const h = lines.findIndex((l) => /^# /.test(l));
  if (h >= 0) {
    const t = /^#\s+(\d{4})\.\s+(.+?)\s*$/.exec(lines[h]);
    if (t) { adr.headingNumber = Number(t[1]); adr.title = t[2]; } else adr.title = lines[h].replace(/^#\s+/, '').trim();
  }
  adr.titleLine = h + 1;
  let cur = null;
  let sub = null;
  const first = lines.findIndex((l) => /^## /.test(l));
  const metaEnd = first < 0 ? lines.length : first;
  for (let i = Math.max(h, 0) + 1; i < metaEnd; i++) {
    const mm = /^- (Status|Date|Deciders|Supersedes|Superseded by):\s*(.*?)\s*$/.exec(lines[i]);
    if (mm) { adr.meta[mm[1]] = mm[2]; adr.metaLines[mm[1]] = i + 1; }
  }
  for (let i = metaEnd; i < lines.length; i++) {
    const s = /^## (.+?)\s*$/.exec(lines[i]);
    const ss = /^### (.+?)\s*$/.exec(lines[i]);
    if (s) { cur = { name: s[1], line: i + 1, body: [], subs: [] }; adr.sections.push(cur); sub = null; continue; }
    if (!cur) continue;
    if (ss) { sub = { name: ss[1], line: i + 1, body: [] }; cur.subs.push(sub); continue; }
    (sub || cur).body.push(lines[i]);
  }
  for (const sec of adr.sections) {
    sec.text = sec.body.join('\n').trim();
    for (const sb of sec.subs) sb.text = sb.body.join('\n').trim();
  }
  return adr;
}

export function section(adr, name) {
  return adr.sections.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

export function loadAll(dir) {
  return listAdrFiles(dir).map((f) => parseAdr(readFileSync(join(dir, f), 'utf8'), f));
}

const refs = (v) => (v ? [...v.matchAll(/\d{4}/g)].map((x) => Number(x[0])) : []);
const optionName = (h) => h.replace(/^option\s+[a-z0-9]+\s*[:.)-]\s*/i, '').trim().toLowerCase();
const wordCount = (t) => (t.match(/\S+/g) || []).length;

export const RULES = JSON.parse(readFileSync(new URL('./rules.json', import.meta.url), 'utf8')).rules;
const SEV = Object.fromEntries(RULES.map((r) => [r.id, r.severity]));

export function lint(dir, { today = new Date().toISOString().slice(0, 10), staleDays = 60 } = {}) {
  const findings = [];
  const add = (file, rule, message, line = 0) => findings.push({ file, rule, severity: SEV[rule], line, message });
  const adrs = loadAll(dir);
  const byNumber = new Map();
  for (const a of adrs) {
    if (a.number === null) continue;
    if (!byNumber.has(a.number)) byNumber.set(a.number, []);
    byNumber.get(a.number).push(a);
  }
  const placeholder = /\bTODO\b|\bTBD\b|lorem ipsum|\{\{|<[^>\n]*(title|decision|context|describe|option)[^>\n]*>/i;
  for (const a of adrs) {
    const f = a.file;
    if (a.number === null) { add(f, 'ADR001', 'file name must look like 0001-short-title.md (four digits, lowercase words, hyphens)'); continue; }
    if (byNumber.get(a.number).length > 1) add(f, 'ADR002', `number ${pad(a.number)} is used by more than one file`);
    if (a.headingNumber === null) add(f, 'ADR004', 'first heading must be "# NNNN. Title"', a.titleLine);
    else if (a.headingNumber !== a.number) add(f, 'ADR004', `heading number ${pad(a.headingNumber)} does not match file name ${pad(a.number)}`, a.titleLine);
    if (a.title.length > 80) add(f, 'ADR018', `title is ${a.title.length} characters; keep it under 80`, a.titleLine);
    for (const k of ['Status', 'Date']) if (!a.meta[k]) add(f, 'ADR005', `missing "- ${k}:" line under the title`, a.titleLine);
    const status = (a.meta.Status || '').toLowerCase();
    if (a.meta.Status && !STATUSES.includes(status)) add(f, 'ADR006', `status "${a.meta.Status}" is not one of ${STATUSES.join(', ')}`, a.metaLines.Status);
    if (a.meta.Date && !isRealDate(a.meta.Date)) add(f, 'ADR007', `date "${a.meta.Date}" is not a real date in YYYY-MM-DD form`, a.metaLines.Date);
    else if (a.meta.Date && a.meta.Date > today) add(f, 'ADR020', `date ${a.meta.Date} is in the future`, a.metaLines.Date);
    if (status === 'proposed' && isRealDate(a.meta.Date || '')) {
      const age = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${a.meta.Date}T00:00:00Z`)) / 86400000);
      if (age > staleDays) add(f, 'ADR016', `proposed for ${age} days; decide it or reject it`, a.metaLines.Date);
    }
    for (const name of REQUIRED_SECTIONS) if (!section(a, name)) add(f, 'ADR008', `missing section "## ${name}"`);
    const opts = section(a, 'Options considered');
    if (opts && opts.subs.length < 2) add(f, 'ADR009', `${opts.subs.length} option(s) listed; record at least two real alternatives as "### Option X: name"`, opts.line);
    const dec = section(a, 'Decision');
    if (dec && opts && opts.subs.length) {
      const text = dec.text.toLowerCase();
      const named = opts.subs.some((s) => {
        const n = optionName(s.name);
        const label = /^option\s+[a-z0-9]+/i.exec(s.name);
        return (n && text.includes(n)) || (label && text.includes(label[0].toLowerCase()));
      });
      if (!named) add(f, 'ADR010', 'the Decision does not name the option it chose', dec.line);
    }
    if (dec && wordCount(dec.text) > 150) add(f, 'ADR019', `the Decision runs to ${wordCount(dec.text)} words; state it in a few sentences and move the reasoning to Context or Options`, dec.line);
    const con = section(a, 'Consequences');
    if (con) {
      for (const kind of ['good', 'bad']) {
        const sb = con.subs.find((s) => s.name.toLowerCase().startsWith(kind));
        if (!sb || !sb.text) add(f, 'ADR011', `Consequences needs a non-empty "### ${kind === 'good' ? 'Good' : 'Bad'}" subsection; a decision with no downside is a sales pitch`, con.line);
      }
    }
    if (!section(a, 'Review')) add(f, 'ADR017', 'no "## Review" section saying when to revisit this decision');
    for (let i = 0; i < a.lines.length; i++) if (placeholder.test(a.lines[i])) { add(f, 'ADR015', `placeholder text left in: "${a.lines[i].trim().slice(0, 60)}"`, i + 1); break; }
    for (const key of ['Supersedes', 'Superseded by']) {
      for (const n of refs(a.meta[key])) {
        const target = (byNumber.get(n) || [])[0];
        if (!target) { add(f, 'ADR012', `${key} ${pad(n)} but no such ADR exists`, a.metaLines[key]); continue; }
        const back = key === 'Supersedes' ? 'Superseded by' : 'Supersedes';
        if (!refs(target.meta[back]).includes(a.number)) add(f, 'ADR013', `${key} ${pad(n)}, but ${target.file} does not list ${pad(a.number)} under "${back}"`, a.metaLines[key]);
      }
    }
    const hasBy = refs(a.meta['Superseded by']).length > 0;
    if (status === 'superseded' && !hasBy) add(f, 'ADR014', 'status is superseded but there is no "- Superseded by:" line', a.metaLines.Status);
    if (hasBy && status !== 'superseded') add(f, 'ADR014', `has "Superseded by" but status is "${a.meta.Status}"`, a.metaLines.Status);
  }
  const nums = [...byNumber.keys()].sort((x, y) => x - y);
  for (let i = 1; i < nums.length; i++) if (nums[i] - nums[i - 1] > 1) add(byNumber.get(nums[i])[0].file, 'ADR003', `numbering jumps from ${pad(nums[i - 1])} to ${pad(nums[i])}`);
  findings.sort((x, y) => x.file.localeCompare(y.file) || x.rule.localeCompare(y.rule) || x.line - y.line);
  return { count: adrs.length, findings };
}

export function template({ number, title, date, deciders = '' }) {
  return `# ${pad(number)}. ${title}

- Status: proposed
- Date: ${date}
- Deciders: ${deciders || 'TODO: who decides'}

## Context

TODO: describe the situation, the forces at play and what has changed. Facts, not opinions.

## Options considered

### Option A: TODO name

TODO: what it is, and the honest case for and against.

### Option B: TODO name

TODO: what it is, and the honest case for and against.

## Decision

TODO: state the chosen option in one or two active sentences ("We will ...").

## Consequences

### Good

- TODO

### Bad

- TODO

## Review

TODO: the date or the trigger for looking at this decision again.
`;
}

export function setMeta(text, key, value) {
  const lines = text.split('\n');
  const first = lines.findIndex((l) => /^## /.test(l));
  const end = first < 0 ? lines.length : first;
  let last = -1;
  for (let i = 0; i < end; i++) {
    if (new RegExp(`^- ${key}:`).test(lines[i])) { lines[i] = `- ${key}: ${value}`; return lines.join('\n'); }
    if (/^- (Status|Date|Deciders|Supersedes|Superseded by):/.test(lines[i])) last = i;
  }
  const at = last >= 0 ? last + 1 : 1;
  lines.splice(at, 0, `- ${key}: ${value}`);
  return lines.join('\n');
}

export function indexMarkdown(dir) {
  const adrs = loadAll(dir).filter((a) => a.number !== null).sort((x, y) => x.number - y.number);
  const rows = adrs.map((a) => {
    const rel = [];
    if (a.meta.Supersedes) rel.push(`supersedes ${refs(a.meta.Supersedes).map(pad).join(', ')}`);
    if (a.meta['Superseded by']) rel.push(`superseded by ${refs(a.meta['Superseded by']).map(pad).join(', ')}`);
    return `| [${pad(a.number)}](${a.file}) | ${a.title} | ${a.meta.Status || ''} | ${a.meta.Date || ''} | ${rel.join('; ')} |`;
  });
  const counts = {};
  for (const a of adrs) counts[(a.meta.Status || 'unknown').toLowerCase()] = (counts[(a.meta.Status || 'unknown').toLowerCase()] || 0) + 1;
  const summary = Object.keys(counts).sort().map((k) => `${counts[k]} ${k}`).join(', ');
  return `# Decision log

Generated by \`adr.mjs index\`; do not edit by hand. ${adrs.length} decision(s): ${summary || 'none'}.

| Number | Title | Status | Date | Relations |
| --- | --- | --- | --- | --- |
${rows.join('\n')}
`;
}
