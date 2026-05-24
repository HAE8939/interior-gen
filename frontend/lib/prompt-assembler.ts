/**
 * Prompt assembler — renders a chosen template against the current FormState.
 *
 * This is a SCAFFOLD implementation. The product implementation lives on the
 * backend (Python) and adds LLM polish, dedup, translation of free-text.
 * Here we just do deterministic placeholder substitution so the user can
 * see prompts update in real time as they tweak the form.
 *
 * Supported placeholder syntax (mirrors `vocabulary/prompt_templates.json`):
 *   {{key.field}}            single field lookup
 *   {{key.keywords_en|join:', '}}    array → joined string
 *   {{key.keywords_en|random:2}}     array → first N items (deterministic)
 *   [[ ... ]]                 optional block; dropped if any inner var resolves empty
 *   {{#if name}} ... {{/if}}  conditional block (used by MJ suffix for negatives)
 */

import { findById, findByIds, vocab } from "./vocab";
import type { AssembledPrompt, FormState, PromptTemplate } from "./types";

// ----------------- bag builder ----------------- //

type BagValue = unknown;
type Bag = Record<string, BagValue>;

/** Combine `keywords_en` arrays from multi-selected items, dedupe, preserve order. */
function combineKeywords(items: Array<{ keywords_en?: readonly string[] }>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    for (const kw of item.keywords_en ?? []) {
      if (!seen.has(kw)) {
        seen.add(kw);
        out.push(kw);
      }
    }
  }
  return out;
}

function combineNameEn(items: Array<{ name_en?: string }>): string {
  return items
    .map((x) => x.name_en)
    .filter(Boolean)
    .join(", ");
}

/**
 * Build a `bag` keyed by the placeholder root (e.g. `space`, `style`, `camera`)
 * with values matching the placeholder fields used in template_en strings.
 */
export function buildBag(state: FormState, freetextEn = ""): Bag {
  const space = findById(vocab.spaces, state.space);
  const style = findById(vocab.styles, state.style);
  const lighting = findById(vocab.lighting, state.lighting);
  const season = findById(vocab.seasons, state.season);
  const weather = findById(vocab.weather, state.weather);
  const ratio = findById(vocab.composition.ratios, state.ratio);
  const perspective = findById(vocab.composition.perspectives, state.composition.perspective);
  const shot = findById(vocab.composition.shots, state.composition.shot);
  const cameraBody = findById(vocab.camera.bodies, state.camera.body);
  const cameraLens = findById(vocab.camera.lenses, state.camera.lens);
  const cameraAperture = findById(vocab.camera.apertures, state.camera.aperture);
  const cameraIso = findById(vocab.camera.iso, state.camera.iso);
  const artist = state.artist ? findById(vocab.artists.all, state.artist) : undefined;

  const materials = findByIds(vocab.materials, state.materials);
  const furniture = findByIds(vocab.furniture, state.furniture);
  const colors = findByIds(vocab.colors.palettes, state.colors);
  const moods = findByIds(vocab.moods, state.mood);
  const qm = findByIds(vocab.qualityModifiers, state.qualityModifiers);
  const negKeywords = state.negativeGroups
    .map((id) => vocab.negativePresets[id]?.keywords_en ?? [])
    .flat();

  return {
    space: space ? { name_en: space.name_en, keywords_en: [space.name_en] } : null,
    style: style ?? null,
    materials: { keywords_en: combineKeywords(materials), name_en: combineNameEn(materials) },
    furniture: { keywords_en: combineKeywords(furniture), name_en: combineNameEn(furniture) },
    colors: { keywords_en: combineKeywords(colors), name_en: combineNameEn(colors) },
    lighting: lighting ?? null,
    season: season ?? null,
    weather: weather ?? null,
    composition: {
      perspective: perspective ?? null,
      shot: shot ?? null,
    },
    ratio: ratio ?? null,
    camera: {
      body: cameraBody ?? null,
      lens: cameraLens ?? null,
      aperture: cameraAperture ?? null,
      iso: cameraIso ?? null,
    },
    mood: { keywords_en: combineKeywords(moods), name_en: combineNameEn(moods) },
    artist: artist ?? null,
    quality_modifiers: { keywords_en: combineKeywords(qm), name_en: combineNameEn(qm) },
    negative: { keywords_en: negKeywords },
    freetext_en: freetextEn,
  };
}

// ----------------- placeholder resolution ----------------- //

function getPath(bag: Bag, path: string): unknown {
  // top-level shortcuts (e.g. `freetext_en`)
  if (!path.includes(".")) return bag[path];
  const parts = path.split(".");
  let cur: unknown = bag;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function applyFilter(value: unknown, filter: string, arg: string): string {
  if (filter === "join") {
    if (!Array.isArray(value) || value.length === 0) return "";
    return value.join(arg.replace(/^['"]|['"]$/g, ""));
  }
  if (filter === "random") {
    if (!Array.isArray(value) || value.length === 0) return "";
    const n = Math.max(1, parseInt(arg, 10) || 1);
    // Deterministic in scaffold (first N); backend should do real random.
    return value.slice(0, n).join(", ");
  }
  // unknown filter → fall back to stringify
  return Array.isArray(value) ? value.join(", ") : String(value ?? "");
}

function resolvePlaceholder(bag: Bag, expression: string): {
  resolved: string;
  hadValue: boolean;
} {
  // expression like "key.path" or "key.path|filter:arg"
  const filterMatch = expression.match(/^([^|]+)\|([^:]+)(?::(.*))?$/);
  let path: string;
  let filter: string | null = null;
  let arg = "";
  if (filterMatch) {
    path = filterMatch[1].trim();
    filter = filterMatch[2].trim();
    arg = (filterMatch[3] ?? "").trim();
  } else {
    path = expression.trim();
  }

  const value = getPath(bag, path);

  if (value == null || value === "") {
    return { resolved: "", hadValue: false };
  }
  if (Array.isArray(value) && value.length === 0) {
    return { resolved: "", hadValue: false };
  }

  if (filter) {
    const s = applyFilter(value, filter, arg);
    return { resolved: s, hadValue: s.length > 0 };
  }

  if (Array.isArray(value)) {
    return { resolved: value.join(", "), hadValue: true };
  }
  return { resolved: String(value), hadValue: true };
}

// ----------------- block handlers ----------------- //

const PLACEHOLDER_RE = /\{\{([^{}]+?)\}\}/g;
const OPTIONAL_BLOCK_RE = /\[\[([\s\S]*?)\]\]/g;
const IF_BLOCK_RE = /\{\{#if\s+([^}]+?)\}\}([\s\S]*?)\{\{\/if\}\}/g;

function renderInline(text: string, bag: Bag): { rendered: string; missing: boolean } {
  let missing = false;
  const rendered = text.replace(PLACEHOLDER_RE, (_, expr: string) => {
    const { resolved, hadValue } = resolvePlaceholder(bag, expr);
    if (!hadValue) missing = true;
    return resolved;
  });
  return { rendered, missing };
}

function expandIfBlocks(text: string, bag: Bag): string {
  return text.replace(IF_BLOCK_RE, (_, key: string, inner: string) => {
    const v = getPath(bag, key.trim());
    const truthy =
      v != null &&
      v !== "" &&
      !(Array.isArray(v) && v.length === 0) &&
      !(typeof v === "object" && Object.keys(v as object).length === 0);
    if (!truthy) return "";
    const out = renderInline(inner, bag);
    return out.rendered;
  });
}

function expandOptionalBlocks(text: string, bag: Bag): string {
  return text.replace(OPTIONAL_BLOCK_RE, (_, inner: string) => {
    const { rendered, missing } = renderInline(inner, bag);
    return missing ? "" : rendered;
  });
}

/** Final cleanup: collapse repeated commas/whitespace from dropped blocks. */
function cleanup(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/^\s*,\s*/, "")
    .replace(/\s*,\s*$/, "")
    .trim();
}

// ----------------- public entry ----------------- //

export function renderTemplate(template: string, bag: Bag): string {
  // 1) {{#if ...}}...{{/if}} (used by MJ suffix)
  let out = expandIfBlocks(template, bag);
  // 2) [[ ... ]] optional blocks
  out = expandOptionalBlocks(out, bag);
  // 3) plain {{...}} placeholders
  out = renderInline(out, bag).rendered;
  // 4) cleanup
  return cleanup(out);
}

export function assemble(state: FormState, template: PromptTemplate): AssembledPrompt {
  const notes: string[] = [];

  // For the scaffold, we don't translate freeText — we just pass it through.
  // The backend will translate Chinese freeText to English via LLM before
  // calling this same assembler.
  const freetextEn = state.freeText.trim();
  if (freetextEn && /[一-鿿]/.test(freetextEn)) {
    notes.push("⚠ 自由文本含中文，正式版本会由后端 LLM 翻译为英文后再融入。脚手架暂直接拼接。");
  }

  const bag = buildBag(state, freetextEn);

  const promptEn = renderTemplate(template.template_en, bag);
  const mjSuffix = template.template_midjourney_suffix
    ? renderTemplate(template.template_midjourney_suffix, bag)
    : "";

  const negativePrompt = (bag.negative as { keywords_en: string[] }).keywords_en.join(", ");

  return {
    prompt_en: promptEn,
    mj_suffix: mjSuffix,
    negative_prompt: negativePrompt,
    template_id: template.id,
    notes,
  };
}
