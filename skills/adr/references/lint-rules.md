# Lint rules

Run `node adr.mjs lint <dir>`. Errors make the command exit 1; warnings do so only with `--strict`. `adr.mjs rules` prints this list.

| Rule | Severity | Checks |
| --- | --- | --- |
| ADR001 | error | File name is not NNNN-lowercase-title.md |
| ADR002 | error | Two files share a number |
| ADR003 | warning | Numbering has a gap |
| ADR004 | error | Heading is not '# NNNN. Title' or its number differs from the file name |
| ADR005 | error | Status or Date line is missing |
| ADR006 | error | Status is not proposed, accepted, rejected, deprecated or superseded |
| ADR007 | error | Date is not a real YYYY-MM-DD date |
| ADR008 | error | A required section is missing (Context, Options considered, Decision, Consequences) |
| ADR009 | error | Fewer than two options are recorded |
| ADR010 | error | The Decision does not name the option it chose |
| ADR011 | error | Consequences lacks a non-empty Good or Bad subsection |
| ADR012 | error | Supersedes or Superseded by points to an ADR that does not exist |
| ADR013 | error | A supersession link is not reciprocal |
| ADR014 | error | Status and Superseded by disagree |
| ADR015 | error | Template placeholder text is still present |
| ADR016 | warning | Proposed for longer than the stale limit (`--stale-days`, default 60) |
| ADR017 | warning | No Review section |
| ADR018 | warning | Title is longer than 80 characters |
| ADR019 | warning | Decision section is longer than 150 words |
| ADR020 | warning | Date is in the future |

## Overriding

There is no inline override. If a rule does not fit your log, fix the record or change `rules.json` in your own copy and say why in your own contributing notes.
