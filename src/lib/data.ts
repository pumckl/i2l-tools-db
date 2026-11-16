/**
 * Zentrale Daten-Helfe der i2L Tool-Datenbank.
 * Lädt die kuratierten JSON-Dateien und verknüpft sie mit der
 * GitHub-Anreicherung (src/data/enriched.json, via npm run data:refresh).
 */
import toolsRaw from "../data/tools.json";
import categoriesRaw from "../data/categories.json";
import enrichedRaw from "../data/enriched.json";

export interface Tool {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  license: string;
  licenseType: "open-source" | "proprietär";
  selfHost: "ja" | "teilweise" | "nein";
  aufwand: 1 | 2 | 3;
  website: string;
  repo?: string;
  docs?: string;
  replaces?: string[];
  useCases?: string[];
  audience?: string[];
  platforms?: string[];
  dsGvo?: string;
  goodPractice?: string;
}

export interface Category {
  slug: string;
  name: string;
  short: string;
  description: string;
  color: string;
  soft: string;
  fg: string;
}

export interface Enrichment {
  stars?: number;
  license?: string | null;
  pushedAt?: string;
  openIssues?: number;
  archived?: boolean;
  homepage?: string | null;
  fetchedAt?: string;
}

export interface Enriched {
  fetchedAt: string | null;
  repos: Record<string, Enrichment>;
}

export const tools = toolsRaw as Tool[];
export const categories = categoriesRaw as Category[];
export const enriched = enrichedRaw as unknown as Enriched;

const repoKey = (repo?: string) =>
  repo?.replace(/^https:\/\/github\.com\//, "").replace(/\/$/, "") ?? null;

/** Anreicherungsdaten (Sterne, Aktivität) für ein Tool – null, wenn nicht erhoben. */
export function enrichmentFor(tool: Tool): Enrichment | null {
  const key = repoKey(tool.repo);
  return key && enriched.repos[key] ? enriched.repos[key] : null;
}

export function categoryBySlug(slug: string): Category {
  return categories.find((c) => c.slug === slug) ?? {
    slug,
    name: slug,
    short: slug,
    description: "",
    color: "#00395b",
    soft: "#f3f5f6",
    fg: "#00395b",
  };
}

export const AUFWAND: Record<number, string> = {
  1: "niedrig – sofort nutzbar",
  2: "mittel – etwas Einarbeitung",
  3: "hoch – betreuter Betrieb nötig",
};

export const SELFHOST_LABEL: Record<string, string> = {
  ja: "selfhostbar",
  teilweise: "teilweise selfhostbar (z. B. Sync)",
  nein: "lokal installierbar / App",
};

export function formatStars(stars?: number): string {
  if (stars == null) return "";
  if (stars >= 1000) return `${(stars / 1000).toFixed(1).replace(".", ",")}k`;
  return String(stars);
}

/** Letzte Aktivität als relative Angabe („vor 3 Monaten“) – deutsch. */
export function lastPushLabel(pushedAt?: string): string {
  if (!pushedAt) return "unbekannt";
  const months = Math.max(
    0,
    Math.round((Date.now() - Date.parse(pushedAt)) / (30.44 * 24 * 3600 * 1000))
  );
  if (months <= 1) return "aktiv (letzter Push < 2 Monate)";
  if (months < 12) return `zuletzt aktiv (vor ${months} Monaten)`;
  const years = Math.round(months / 12);
  return `seit ca. ${years} Jahr${years > 1 ? "en" : ""} ohne Update`;
}

/** Suchindex für die Filterlogik im Browser. */
export function searchBlob(tool: Tool): string {
  return [
    tool.name,
    tool.tagline,
    tool.description,
    tool.license,
    tool.useCases?.join(" ") ?? "",
    tool.replaces?.join(" ") ?? "",
    tool.audience?.join(" ") ?? "",
    categoryBySlug(tool.category).name,
  ]
    .join(" ")
    .toLowerCase();
}