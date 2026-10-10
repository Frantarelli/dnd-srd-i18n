// EJEMPLO (español) — empareja los hechizos con sus fichas del SRD oficial (nivel + escuela + clases + texto).
// node tools/reference/align-spells-es.cjs  → spellalign-final.json
// Variables: SRD_OFFICIAL_RAW (texto del PDF oficial sin -layout), OLD_REPO_DATA (opcional, JSON de Open5e v2),
// OUT_DIR (donde escribe resultados; por defecto la carpeta actual). Adaptar mapas de escuelas/clases al idioma.
const path = require('path');
const OUT_DIR = process.env.OUT_DIR || process.cwd();
const I18N_DIR = path.resolve(__dirname, '../../data');
const OFFICIAL_RAW = process.env.SRD_OFFICIAL_RAW;
const OLD_DATA = process.env.OLD_REPO_DATA;
if (!OFFICIAL_RAW) throw new Error('definí SRD_OFFICIAL_RAW (texto del SRD oficial extraído con pdftotext sin -layout)');
// Empareja cada hechizo del SRD 2024 (nuestro) con su ficha en el SRD 5.2.1 oficial en español,
// por nivel + escuela + clases + similitud de texto. Salida: spellalign.json
const fs = require('fs');
const I18N = I18N_DIR;
const OLD = OLD_DATA;
const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

const raw = fs.readFileSync(OFFICIAL_RAW, 'utf8').split('\n').map((l) => l.replace(/\u00ad/g, '').trim());
const HEAD = /^(?:Truco de ([a-zñáéíóú]+)|([A-ZÁÉÍÓÚ][a-zñáéíóú]+) de nivel (\d)) \(([^)]+)\)$/;
const blocks = [];
for (let i = 1; i < raw.length; i++) {
  const m = raw[i].match(HEAD);
  if (!m) continue;
  let j = i - 1;
  while (j > 0 && !raw[j]) j--;
  const name = raw[j];
  const level = m[1] ? 0 : Number(m[3]);
  const school = fold(m[1] || m[2]);
  const classes = m[4].split(',').map((c) => fold(c)).sort();
  let k = i + 1, text = [];
  while (k < raw.length && !HEAD.test(raw[k + 1] || '') && text.length < 60) { text.push(raw[k]); k++; }
  blocks.push({ name, level, school, classes, text: text.join(' ') });
}

const SCHOOL = { abjuration: 'abjuracion', conjuration: 'conjuracion', divination: 'adivinacion', enchantment: 'encantamiento', evocation: 'evocacion', illusion: 'ilusionismo', necromancy: 'nigromancia', transmutation: 'transmutacion' };
const CLASS = { bard: 'bardo', cleric: 'clerigo', druid: 'druida', paladin: 'paladin', ranger: 'explorador', sorcerer: 'hechicero', warlock: 'brujo', wizard: 'mago' };
const nums = (s) => (s.match(/\d+(?:,\d+)?d?\d*/g) || []);
const words = (s) => new Set(fold(s).split(' ').filter((w) => w.length >= 5));
const jac = (a, b) => { const A = new Set(a), B = new Set(b); let i = 0; for (const x of A) if (B.has(x)) i++; return i / Math.max(1, A.size + B.size - i); };

const old = JSON.parse(fs.readFileSync(OLD + 'spells-2024.json', 'utf8'));
const es = JSON.parse(fs.readFileSync(`${I18N}/es/spells.json`, 'utf8'));
const out = { matched: [], ambiguous: [], none: [] };
const used = new Set();
for (const s of old) {
  const slug = s.slug;
  const ourName = es[`${slug}.name`];
  if (!ourName) continue;
  const lvl = s.level_int ?? s.level;
  const sch = SCHOOL[String(s.school).toLowerCase()] || fold(String(s.school));
  const cls = String(s.dnd_class || s.classes || '').split(',').map((c) => CLASS[c.trim().toLowerCase()]).filter(Boolean).sort();
  const desc = es[`${slug}.desc`] || '';
  const cand = blocks.filter((b) => b.level === lvl && b.school === sch && b.classes.join() === cls.join());
  const scored = cand.map((b) => ({ b, score: jac(nums(desc), nums(b.text)) * 0.5 + jac([...words(desc)], [...words(b.text)]) * 0.5 })).sort((a, z) => z.score - a.score);
  if (!scored.length) { out.none.push({ slug, ourName, lvl, sch, cls: cls.join() }); continue; }
  const top = scored[0], second = scored[1];
  const rec = { slug, en: old.find((o) => o.slug === slug)?.name, ours: ourName, official: top.b.name, score: +top.score.toFixed(2), margin: second ? +(top.score - second.score).toFixed(2) : 1 };
  (top.score >= 0.35 && rec.margin >= 0.08 ? out.matched : out.ambiguous).push(rec);
}
fs.writeFileSync(path.join(OUT_DIR, 'spellalign.json'), JSON.stringify(out, null, 1));
console.log({ bloquesOficiales: blocks.length, nuestros: old.length, emparejados: out.matched.length, ambiguos: out.ambiguous.length, sinCandidato: out.none.length });
const diff = out.matched.filter((r) => fold(r.ours) !== fold(r.official));
console.log('emparejados con nombre distinto:', diff.length);
console.log(diff.slice(0, 25).map((r) => `${r.en}: «${r.ours}» → «${r.official}» (${r.score})`).join('\n'));

// ---- Asignación uno a uno: cada ficha oficial se usa una sola vez ----
{
  const pairs = [];
  for (const s of old) {
    const slug = s.slug; const ourName = es[`${slug}.name`]; if (!ourName) continue;
    const lvl = s.level_int ?? s.level;
    const sch = SCHOOL[String(s.school).toLowerCase()] || fold(String(s.school));
    const cls = String(s.dnd_class || '').split(',').map((c) => CLASS[c.trim().toLowerCase()]).filter(Boolean).sort();
    const desc = es[`${slug}.desc`] || '';
    for (const b of blocks) {
      if (b.level !== lvl || b.school !== sch || b.classes.join() !== cls.join()) continue;
      pairs.push({ slug, en: s.name, ours: ourName, official: b.name, score: jac(nums(desc), nums(b.text)) * 0.5 + jac([...words(desc)], [...words(b.text)]) * 0.5 });
    }
  }
  pairs.sort((a, z) => z.score - a.score);
  const slugUsed = new Set(), offUsed = new Set(), final = [];
  for (const p of pairs) { if (slugUsed.has(p.slug) || offUsed.has(p.official)) continue; slugUsed.add(p.slug); offUsed.add(p.official); final.push({ ...p, score: +p.score.toFixed(2) }); }
  fs.writeFileSync(path.join(OUT_DIR, 'spellalign-final.json'), JSON.stringify(final, null, 1));
  const low = final.filter((p) => p.score < 0.3);
  const diff = final.filter((p) => fold(p.ours) !== fold(p.official));
  console.log({ asignados: final.length, scoreBajo: low.length, nombreDistinto: diff.length });
  console.log('score bajo (dudosos):', low.map((p) => `${p.en}→${p.official}(${p.score})`).join(' | '));
}

// ---- Riesgo de cruce: grupos (nivel+escuela+clases) con más de una ficha ----
{
  const fin = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'spellalign-final.json'), 'utf8'));
  const groupOf = (s) => { const lvl = s.level_int ?? s.level; const sch = SCHOOL[String(s.school).toLowerCase()] || fold(String(s.school)); const cls = String(s.dnd_class || '').split(',').map((c) => CLASS[c.trim().toLowerCase()]).filter(Boolean).sort().join(); return `${lvl}|${sch}|${cls}`; };
  const groups = {};
  for (const s of old) (groups[groupOf(s)] ??= []).push(s.slug);
  const risky = [];
  for (const [g, slugs] of Object.entries(groups)) {
    if (slugs.length < 2) continue;
    const members = fin.filter((f) => slugs.includes(f.slug));
    const changed = members.filter((m) => fold(m.ours) !== fold(m.official));
    if (changed.length && members.some((m) => m.score < 0.3)) risky.push({ g, n: slugs.length, members: members.map((m) => `${m.en}→${m.official}(${m.score})`) });
  }
  console.log('grupos con riesgo de cruce (hay cambio de nombre y score<0.3):', risky.length);
  fs.writeFileSync(path.join(OUT_DIR, 'spellalign-risky.json'), JSON.stringify(risky, null, 1));
  console.log(risky.slice(0, 12).map((r) => r.g + ' → ' + r.members.join(' | ')).join('\n'));
}
