# dnd-srd-i18n

The **D&D SRD 5.2.1 (2024 rules)** translated into several languages as **flat JSON files, ready to
use in any project**, plus the tools to add and verify languages with AI assistance.

Spanish (`es`) is complete: 8,773 texts (origin, spells, classes, items, magic items, creatures,
glossary). Adding a language is adding a folder: see below.

> **Honest status:** Spanish was translated with AI help and **reviewed by AI against the official
> Spanish SRD**. A human has not reviewed it yet. Corrections are very welcome.

Most documentation is in Spanish; this page has everything you need to **contribute** or **use** the
data in English.

## Free to use, with one condition: attribution

The texts are free for **any project** (apps, character sheets, bots, modules; commercial too). **The only
condition is attribution**, visible in your product (credits, app footer, licenses page or README).
Copy this line:

> D&D SRD 5.2.1 translations: © 2026 Frantarelli and contributors, CC-BY-4.0 — https://github.com/Frantarelli/dnd-srd-i18n. Based on the System Reference Document 5.2.1 by Wizards of the Coast LLC (CC-BY-4.0). Not endorsed by Wizards of the Coast.

Details in [`ATTRIBUTION.md`](ATTRIBUTION.md) and [`LICENSE-DATA.md`](LICENSE-DATA.md).

## Use the data

Plain JSON, `key → text`, no install needed:

```
data/en/spells.json   { "acid-arrow.name": "Acid Arrow", "acid-arrow.desc": "…" }
data/es/spells.json   { "acid-arrow.name": "Flecha ácida", … }
```

- Catalogs: `origin`, `spells`, `classes`, `items`, `magicitems`, `monsters`, `glossary` (rule
  explanations), `prose` (linking rules: how each glossary term appears inside long texts).
- **Keys are stable and never renamed.** If a key is missing in a language, fall back to English.
- Only prose and names are here; structured data (level, dice, costs) comes from the SRD data
  (e.g. [Open5e](https://open5e.com)) and is joined by key.
- With npm: `"dnd-srd-i18n": "github:Frantarelli/dnd-srd-i18n#v0.3.0"` — **always pin the tag**.
- Developers: [`docs/INTEGRACION.md`](docs/INTEGRACION.md) (integration) and
  [`docs/FORMATO.md`](docs/FORMATO.md) (exact format and guarantees). Both are in Spanish, with
  code samples you can read as they are.
- The texts are **CC-BY-4.0** (Wizards of the Coast SRD 5.2.1): show the attribution in
  [`ATTRIBUTION.md`](ATTRIBUTION.md).

## Contribute

A pull request here **may only contain translations**. An automatic check (`guard`) enforces it.

| ✅ Accepted | ❌ Rejected |
|---|---|
| Editing `data/<language>/<catalog>.json` (any language except `en`) | Changing `data/en/` (English is the source; the maintainer changes it) |
| Adding a new language: `data/<language>/` and `tools/langs/<language>/` | Any other file: `tools/*.mjs`, `.github/`, `package.json`, licenses, docs |
| Fixing a linking rule (`prose.json`) | Deleting or renaming files; symlinks; executable files |
| Plain text with the same keys as English | HTML, scripts, links or images English does not have, templates (`${…}`, `{{…}}`), control or invisible characters |
| The same `{n}` placeholders as English | New keys English does not have; different placeholders |
| **SRD 5.2.1** content (CC-BY-4.0) | Content from commercial books or any other source |

If a legitimate change is rejected, open an issue instead of pushing: it may be a false positive,
and it gets fixed in the repo, not in your pull request.

### Fix a text (5 minutes)

**From the browser (no tools needed):** open the file (`data/<language>/<catalog>.json`), click the
pencil icon, edit **only the text**, and propose the change: GitHub creates the fork and the pull
request for you. Do not change keys.

**From your computer:** fork, clone, edit, then run (Node 20+, nothing to install):

```bash
npm run check    # numbers, dice, structure, glossary, and the security guard
npm test
```

The validator compares every number, dice expression and DC against English. Then open the pull
request and say what you changed and why (and whether you used AI).

### Add a language

```bash
node tools/cli.mjs new-language de "Deutsch"
```

This creates `data/de/` (empty catalogs), `tools/langs/de/guia.md` (style decisions),
`tools/langs/de/glossary.json` (your language's terms and the validator **profile**: decimal
separator, imperial units to convert, forbidden register) and an empty `prose.json`. Then:

1. Fill in the guide and glossary **before** translating.
2. Translate in batches, with AI or by hand; the validator rejects texts with errors. Full process
   (prompts, checks, measured costs): [`docs/MANUAL.md`](docs/MANUAL.md) (Spanish; the method is
   language-independent).
3. You may open a pull request with an **incomplete** language: it is published with its coverage.
4. Once a version is released, apps using this repo **discover the language by themselves**.

### Linking rules (`prose.json`)

Apps underline rule words inside long texts and show the glossary explanation on tap. For that, each
language lists the **literal forms** of each term (never regular expressions):

```jsonc
// data/de/prose.json
{
  "condition.paralyzed.forms": "gelähmt | gelähmte | gelähmten",
  "damage.fire.forms": "Feuer",
  "damage.fire.before": "Schaden durch | Schaden",   // only counts right after this
  "rule.dc.forms": "SG",
  "rule.dc.case": "exact"                             // case-sensitive
}
```

`<term>.forms` is required (up to 40 forms, 1–60 characters; letters, digits, spaces, `'`, `’`, `.`,
`-`); `.case`, `.before`, `.after` are optional. `<term>` must be an id from `data/en/glossary.json`
(without `.name`). A language without `prose.json` simply links nothing.

### Style and fidelity

- **The official SRD wins.** If it exists in your language (Spanish, French, German, Italian), names
  and terms come from there.
- **Fidelity over elegance:** no number, dice, DC, unit or condition may change.
- Passing the validator does not mean it is right: it cannot see a mistranslated rule term. Every text
  is reviewed, not a sample.
- AI-assisted translations are declared; status per language is in `data/VERSION.json`.

### How your changes reach apps

The maintainer reviews and merges (everything goes through them) → publishes a version (`v0.3.1`…) →
apps that pin the version get an automatic pull request and **re-validate everything** before using it.

By contributing you agree your texts are published under **CC-BY-4.0**.
