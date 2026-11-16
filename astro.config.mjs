// @ts-check
import { defineConfig } from "astro/config";

// ============================================================
// URL-Konfiguration vor dem ersten Deployment anpassen:
//
// 1) Eigene Domain (z. B. Uni-Server oder GitHub-Pages-Custom-Domain)
//      site: "https://tools.i2l.uni-flensburg.de"
//    → kein `base` nötig, alle Links laufen vom Root.
//
// 2) GitHub-Projekt-Site  https://<owner>.github.io/<repo>/
//      site: "https://<owner>.github.io/i2l-tools-db"
//      base: "/i2l-tools-db/"
//    → `base` einkommentieren; alle internen Links sind bereits
//      base-fähig gebaut (Layout, Karten, Breadcrumbs).
//
// `site` wirkt auf Canonical-/OG-Tags, `base` auf die Pfadstruktur.
// ============================================================
export default defineConfig({
  site: "https://tools.i2l.uni-flensburg.de",
  // base: "/i2l-tools-db/",
  trailingSlash: "always",
});