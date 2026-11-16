#!/usr/bin/env node
/**
 * Anreicherung der kuratierten Tool-Daten mit Metadaten von der GitHub-REST-API:
 *   - SPDX-Lizenzkennung (aus der repository-Properties)
 *   - Sterne (Beliebtheit als grobe Proxy-Qualität)
 *   - offene Issues & "zuletzt gepusht" (Aktualität/Projekt-Gesundheit)
 *   - Archiviert-Status (Warnung bei eingestellten Projekten)
 *
 * Design-Entscheidungen:
 *   - Die kuratierten Daten (src/data/tools.json) sind die Quelle der Wahrheit.
 *     Dieses Skript schreibt ausschließlich nach src/data/enriched.json.
 *   - Ergebnisse werden gecacht (.cache/github.json), damit wiederholte Builds
 *     die Rate-Limits der GitHub-API (60 req/h anonym, 5000 mit Token) schonen.
 *   - Fehler (404/403/Netzwerk) brechen den Lauf nicht ab – veraltete Daten
 *     bleiben einfach stehen und werden beim nächsten Lauf erneut versucht.
 *
 * Aufruf:  npm run data:refresh
 * Optional: GITHUB_TOKEN=ghp_...  (erhöht das Rate-Limit)
 *           FORCE=1                (ignoriert den Cache einmalig)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const toolsPath = path.join(root, "src/data/tools.json");
const enrichedPath = path.join(root, "src/data/enriched.json");
const cachePath = path.join(root, ".cache/github.json");

const FORCE = Boolean(process.env.FORCE);
const TOKEN = process.env.GITHUB_TOKEN;

const tools = JSON.parse(readFileSync(toolsPath, "utf8"));
const cache = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, "utf8"))
  : {};

const repos = [...new Set(
  tools
    .map((t) => t.repo)
    .filter((r) => r && /^https:\/\/github\.com\//.test(r))
    .map((r) => r.replace(/^https:\/\/github\.com\//, "").replace(/\/+$/, ""))
)];

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "i2L-tools-db",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

let fetched = 0, skipped = 0, failed = 0;

for (const repo of repos) {
  if (!FORCE && cache[repo] && Date.now() - Date.parse(cache[repo].fetchedAt ?? 0) < 7 * 24 * 3600 * 1000) {
    skipped++;
    continue;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (res.status === 404) {
      console.warn(`⚠  Repository nicht gefunden: ${repo} (bitte repo-URL in tools.json prüfen)`);
      failed++;
      continue;
    }
    if (res.status === 403 || res.status === 429) {
      console.warn(`⚠  Rate-Limit erreicht – ${repo} übersprungen. (Optional GITHUB_TOKEN setzen.)`);
      failed++;
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache[repo] = {
      stars: data.stargazers_count,
      license: data.license?.spdx_id && data.license.spdx_id !== "NOASSERTION" ? data.license.spdx_id : null,
      pushedAt: data.pushed_at,
      openIssues: data.open_issues_count,
      archived: data.archived,
      homepage: data.homepage || null,
      fetchedAt: new Date().toISOString(),
    };
    fetched++;
    // klein governance-freundlich: kleine Pause schont das Limit
    await new Promise((r) => setTimeout(r, 120));
  } catch (err) {
    console.warn(`⚠  Fehler bei ${repo}: ${err.message}`);
    failed++;
  }
}

mkdirSync(path.dirname(cachePath), { recursive: true });
writeFileSync(cachePath, JSON.stringify(cache, null, 2));

// enriched.json: gemappt auf Tool-IDs + Stand der Erhebung
const enriched = {
  fetchedAt: new Date().toISOString(),
  repos: cache,
};
writeFileSync(enrichedPath, JSON.stringify(enriched, null, 2) + "\n");

console.log(`\n✔ Anreicherung fertig: ${fetched} abgerufen, ${skipped} aus Cache, ${failed} fehlgeschlagen.`);
console.log(`  → ${enrichedPath}`);
if (failed > 0) process.exitCode = 0; // bewusst kein Fehler: nächster Lauf versucht es erneut