# Contributing

Thanks for taking an interest. This is a small skill with a small CLI: standard library only, deterministic output, plain wording.

## Ground rules

1. **Fictional examples only.** Decision records in `examples/` describe an invented organisation. Never commit a real organisation's decisions, names, costs or system details.
2. **No dependencies** in the skill or the scripts. Test tooling uses `node:test`.
3. **Every lint rule is tested and documented.** Add it to `rules.json`, `references/lint-rules.md` and `test/adr.test.mjs`; a test fails if any of the three is missing.
4. **The linter checks structure, not truth.** Do not add rules that pretend to judge whether the reasoning is sound.
5. **Do not copy other projects.** Write your own wording and examples. The template is inspired by common ADR practice and says so in the README.
6. **British English, plain tone, no long dashes.** A test fails if an em dash or en dash appears in a text file.

## Development

```bash
node --test                  # all tests
node scripts/build.mjs       # regenerate the adapters after editing core.md
node scripts/build.mjs --check
node skills/adr/scripts/adr.mjs index examples/adr --out examples/adr/README.md
```

If you change an example ADR, regenerate its index and run the tests.

## Suggesting a rule or a template change

Open a suggestion. Describe the weak record you want the linter or template to catch, and show a short before and after.
