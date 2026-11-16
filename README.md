# i2L Tool-Datenbank

**Open-Source-Empfehlungen für Studium und Lehre** – ein Angebot des
[Innovation Learning Lab (i2L)](https://www.uni-flensburg.de/kompetenzzentrum-studium-lehre/innovation-learning-lab-i2l)
am Kompetenzzentrum Studium & Lehre (KSL) der Europa-Universität Flensburg.

Die Website ist bewusst **eine kuratierte Datenbank statt ein Klon von Portalen wie
alternativto.net**: Lehr-Kontext (Einsatzszenarien, Datenschutz, Einführungsaufwand)
entsteht durch redaktionelle Einordnung, und die öffentliche API von AlternativeTo ist
ohnehin seit Jahren abgeschaltet. Technische Metadaten (Sterne, Lizenz, Aktivität)
werden stattdessen automatisch über die öffentliche **GitHub-API** angereichert.

## Features

- 🔎 **Suche & Filter** – rein clientseitig (Suche, Kategorie, Selfhosting, Zielgruppe, „nur Open Source“)
- 🗂 **10 Kategorien** von Videokonferenzen bis Wissenschaftlichem Arbeiten, im i2L-CI-Farbsystem
- 📇 **Detailseiten** je Tool: Beschreibung, Einsatzszenarien, DSGVO-/Datenhoheit-Hinweis, Steckbrief
- ⭐ **GitHub-Anreicherung**: Sterne, SPDX-Lizenz, letzter Push, Archiviert-Status (7-Tage-Cache)
- 🛡 **Statisch & datenschutzfreundlich**: keine Cookies, kein Tracking, Schriften lokal (Roboto wie uni-flensburg.de)
- ♿ **Barrierefreiheit**: Skip-Link, Fokus-Zustände, `aria`-Label, `prefers-reduced-motion`
- ✅ **Daten-Validierung** vor jedem Build (IDs, Kategorien, Enums, https-URLs)

## Struktur

```
src/
  data/
    tools.json        # kuratierte Tool-Einträge (Quelle der Wahrheit)
    categories.json   # 10 Kategorien mit i2L-CI-Farben
    enriched.json     # GitHub-Metadaten (generiert, s. u.)
  lib/data.ts         # Datenzugriff + Formater
  components/ToolCard.astro
  layouts/Layout.astro
  pages/
    index.astro       # Suche, Filter, Kategorien
    tools/[id].astro  # Tool-Details
    ueber.astro       # Kriterien & Mitmachen
    rechtliches.astro # Impressum & Datenschutz
scripts/
  enrich.mjs          # GitHub-Anreicherung → src/data/enriched.json
  validate-tools.mjs  # Validierung der Kuratierungsdaten
.github/workflows/
  pages.yml           # CI-Pipeline: Build + Deploy auf GitHub Pages
```

## Befehle

| Befehl                  | Zweck                                             |
| ----------------------- | ------------------------------------------------- |
| `npm install`          | Abhängigkeiten installieren                       |
| `npm run dev`           | Dev-Server (http://localhost:4321)                 |
| `npm run data:refresh`  | GitHub-Metadaten aktualisieren (7-Tage-Cache)     |
| `npm run build`         | Validierung + statischen Build nach `dist/`      |
| `npm run validate`      | nur Daten-Validierung                              |

Für die Anreicherung gilt das GitHub-Rate-Limit (60 Anfragen/h anonym,
5.000 mit `GITHUB_TOKEN=ghp_… data:refresh`). Ergebnisse werden pro Repository
7 Tage in `.cache/github.json` gecacht – der Build funktioniert auch ohne
Anreicherung (die Karte zeigt dann einfach keine Sterne).

## Einen Tool-Eintrag ergänzen

1. In `src/data/tools.json` einen Eintrag nach Schema ergänzen.
2. `npm run validate` muss grün sein.
3. Danach `npm run data:refresh`, damit GitHub-Metadaten zum Eintrag erscheinen.

**Schema (Kurzfassung):**

```jsonc
{
  "id": "kein-name-mit-leerzeichen",
  "name": "Projektname",
  "category": "slug-aus-categories.json",
  "tagline": "Ein Satz, wozu es gut ist.",
  "description": "2–4 Sätze redaktionelle Einordnung.",
  "license": "SPDX-Kennung",
  "licenseType": "open-source",        // oder "proprietär" (Ausnahme, wird markiert)
  "selfHost": "ja",                    // "ja" | "teilweise" | "nein"
  "aufwand": 1,                        // 1=niedrig 2=mittel 3=hoch
  "website": "https://…",
  "repo": "https://github.com/owner/name",
  "docs": "https://…",                 // optional
  "replaces": ["Proprietäres Original"],
  "useCases": ["Szenario 1"],
  "audience": ["lehrende", "studierende", "mitarbeitende"],
  "platforms": ["web", "windows"],
  "dsGvo": "Hinweis zu Datenschutz/Datenhoheit",
  "goodPractice": "Optional: Good-Practice-Beispiel aus der Lehre"
}
```

## Lizenzen

- Tool-Beschreibungen (Daten): **CC BY-SA 4.0**
- Website-Code: **MIT**
- Eingetragene Projekte: jeweiligen Rechteinhabern; Einträge sind redaktionelle Empfehlungen.

## Deployment

### Variante 1: GitHub Pages + GitHub Actions (fertig eingerichtet)

Die Pipeline in `.github/workflows/pages.yml`:

- **baut & validiert** bei jedem Push auf `main` und in Pull Requests (offizielle GitHub-Actions),
- **deployt** das statische `dist/` automatisch auf GitHub Pages,
- **baut nächtlich (03:30 UTC)** neu, damit die GitHub-Metadaten (Sterne, SPDX-Lizenz, Aktivität) frisch bleiben, und
- ist **manuell triggerbar** (Repo-Tab *Actions* → *Build & Deploy* → *Run workflow*).

**Einmalige Einrichtung (ca. 3 Minuten):**

1. Repo auf GitHub pushen.
2. *Settings → Pages → Build and deployment → Source*: **GitHub Actions** wählen.
3. Fertig – beim nächsten Push auf `main` läuft die Pipeline automatisch.

Ein Access-Token ist nicht nötig: GitHub stellt der Pipeline automatisch `GITHUB_TOKEN` bereit (Rate-Limit 1.000 Anfragen/h – reicht für ~47 Repos mit großem Puffer).

**URL-Konfiguration** (siehe Kommentare in `astro.config.mjs`):

- Projekt-Site `https://<owner>.github.io/<repo>/` → dort die `base`-Zeile einkommentieren/anpassen (alle internen Links sind bereits base-fähig gebaut).
- Eigene Domain (z. B. `tools.i2l.uni-flensburg.de`): *Settings → Pages → Custom domain* – kein `base` nötig.
- `site` in `astro.config.mjs` jeweils auf die finale URL setzen (wirkt auf Canonical-/OG-Tags).

**Hinweis Datenhoheit:** GitHub Pages wird über ein globales CDN ausgeliefert (US-Anbieter). Für diese tracker-, cookie- und loginfreie statische Seite ohne personenbezogene Daten unbedenklich – wer Datenhoheit will, nutzt Variante 2 auf dem Uni-Webserver.

### Variante 2: Beliebiger Webserver

`npm run build` → `dist/` auf einen Webserver kopieren (Uni-TYPO3-Server, nginx, …). `dist/` ist vollständig statisch, keine Laufzeitumgebung nötig – auch `base` dann nicht setzen, solange die Site unter einer eigenen (Sub-)Domain läuft.