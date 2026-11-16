#!/usr/bin/env node
/**
 * Kleine, abhängigkeitsfreie Validierung der kuratierten Daten.
 * Prüft: eindeutige IDs, vorhandene Pflichtfelder, gültige Kategorien,
 * Enums (selfHost, aufwand) und https-URLs.
 *
 * Aufruf: npm run validate  (läuft automatisch vor jedem Build)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"));

const tools = read("src/data/tools.json");
const categories = read("src/data/categories.json");

const errors = [];
const warnings = [];

const catSlugs = new Set(categories.map((c) => c.slug));
const selfHostValues = new Set(["ja", "teilweise", "nein"]);
const required = ["id", "name", "category", "tagline", "description", "license", "website", "repo"];

const ids = new Set();
for (const t of tools) {
  const label = t.id ?? t.name ?? "<ohne id>";
  for (const field of required) {
    if (!t[field] || String(t[field]).trim() === "") errors.push(`${label}: Pflichtfeld "${field}" fehlt.`);
  }
  if (t.id) {
    if (ids.has(t.id)) errors.push(`${t.id}: ID doppelt vergeben.`);
    if (!/^[a-z0-9-]+$/.test(t.id)) errors.push(`${t.id}: ID darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.`);
    ids.add(t.id);
  }
  if (t.category && !catSlugs.has(t.category)) errors.push(`${label}: unbekannte Kategorie "${t.category}".`);
  if (t.selfHost && !selfHostValues.has(t.selfHost)) errors.push(`${label}: selfHost muss ja/teilweise/nein sein (ist "${t.selfHost}").`);
  if (t.aufwand !== undefined && ![1, 2, 3].includes(t.aufwand)) errors.push(`${label}: aufwand muss 1, 2 oder 3 sein.`);
  for (const [key, val] of Object.entries(t)) {
    if (["website", "repo", "docs"].includes(key) && val && !String(val).startsWith("https://")) {
      errors.push(`${label}: ${key} muss mit https:// beginnen (ist "${val}").`);
    }
    if (["useCases", "replaces", "platforms", "tags", "audience"].includes(key) && !Array.isArray(val)) {
      errors.push(`${label}: ${key} muss ein Array sein.`);
    }
  }
  if (!t.dsGvo) warnings.push(`${label}: Hinweis zum Datenschutz (dsGvo) fehlt – sollte ergänzt werden.`);
}

if (tools.length === 0) errors.push("tools.json ist leer.");

// enriched.json muss existieren (frischer Checkout ohne data:refresh)
const enrichedPath = path.join(root, "src/data/enriched.json");
if (!existsSync(enrichedPath)) {
  writeFileSync(enrichedPath, JSON.stringify({ fetchedAt: null, repos: {} }, null, 2) + "\n");
  console.log("→ src/data/enriched.json war nicht vorhanden – leere Datei angelegt (npm run data:refresh befüllt sie).");
}

for (const w of warnings) console.warn(`⚠  ${w}`);
if (errors.length) {
  console.error(`\n✘ ${errors.length} Fehler in den Daten:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✔ Daten valid: ${tools.length} Tools in ${categories.length} Kategorien.`);