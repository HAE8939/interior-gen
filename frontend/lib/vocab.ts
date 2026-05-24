/**
 * Vocabulary loader — single source of truth for all 14 vocab JSON files.
 *
 * We import the JSON statically so Next.js bundles them at build time. No
 * fs reads at runtime.
 *
 * If `next.config.ts` outputFileTracingRoot is set to the parent dir, these
 * relative imports work both in `next dev` and `next build`.
 */

import stylesData from "@vocab/styles.json";
import spacesData from "@vocab/spaces.json";
import materialsData from "@vocab/materials.json";
import lightingData from "@vocab/lighting.json";
import seasonsWeatherData from "@vocab/seasons_weather.json";
import cameraData from "@vocab/camera.json";
import compositionData from "@vocab/composition.json";
import colorsData from "@vocab/colors.json";
import moodsData from "@vocab/moods.json";
import furnitureData from "@vocab/furniture.json";
import artistsData from "@vocab/artists.json";
import qualityModifiersData from "@vocab/quality_modifiers.json";
import negativePromptsData from "@vocab/negative_prompts.json";
import promptTemplatesData from "@vocab/prompt_templates.json";
import indexData from "@vocab/index.json";

import type {
  StyleItem,
  SpaceItem,
  MaterialItem,
  LightingItem,
  SeasonItem,
  WeatherItem,
  CameraItem,
  CompositionItem,
  RatioItem,
  ColorItem,
  PaletteItem,
  MoodItem,
  FurnitureItem,
  ArtistItem,
  QualityModifierItem,
  NegativePreset,
  PromptTemplate,
  FormState,
} from "./types";

// Type-narrow the imported JSON shapes.
// We use `unknown` casts because TS infers very precise shapes from JSON files,
// which can clash with our looser shared types if any single entry adds an
// extra field (e.g. `feel: string[]` vs `string`).
const styles = (stylesData as unknown as { items: StyleItem[] }).items;
const spaces = (spacesData as unknown as { items: SpaceItem[] }).items;
const materials = (materialsData as unknown as { items: MaterialItem[] }).items;
const lighting = (lightingData as unknown as { items: LightingItem[] }).items;
const seasons = (seasonsWeatherData as unknown as { seasons: SeasonItem[] }).seasons;
const weather = (seasonsWeatherData as unknown as { weather: WeatherItem[] }).weather;

const cameraGroups = cameraData as unknown as {
  bodies: CameraItem[];
  lenses: CameraItem[];
  apertures: CameraItem[];
  iso: CameraItem[];
  formats: CameraItem[];
};
const camera = {
  bodies: cameraGroups.bodies,
  lenses: cameraGroups.lenses,
  apertures: cameraGroups.apertures,
  iso: cameraGroups.iso,
  formats: cameraGroups.formats,
};

const compositionGroups = compositionData as unknown as {
  perspectives: CompositionItem[];
  shots: CompositionItem[];
  framing: CompositionItem[];
  ratios: RatioItem[];
};
const composition = {
  perspectives: compositionGroups.perspectives,
  shots: compositionGroups.shots,
  framing: compositionGroups.framing,
  ratios: compositionGroups.ratios,
};

const colorGroups = colorsData as unknown as {
  single_colors: ColorItem[];
  palettes: PaletteItem[];
};
const colors = {
  single: colorGroups.single_colors,
  palettes: colorGroups.palettes,
};

const moods = (moodsData as unknown as { items: MoodItem[] }).items;
const furniture = (furnitureData as unknown as { items: FurnitureItem[] }).items;

const artistGroups = artistsData as unknown as {
  architects: ArtistItem[];
  interior_designers: ArtistItem[];
  photographers: ArtistItem[];
};
const artists = {
  architects: artistGroups.architects,
  interior_designers: artistGroups.interior_designers,
  photographers: artistGroups.photographers,
  /** flat list for select dropdowns */
  all: [
    ...artistGroups.architects,
    ...artistGroups.interior_designers,
    ...artistGroups.photographers,
  ],
};

const qualityModifiers = (qualityModifiersData as unknown as {
  items: QualityModifierItem[];
}).items;

const negativePresets = (negativePromptsData as unknown as {
  presets: Record<string, NegativePreset>;
}).presets;

const templates = (promptTemplatesData as unknown as {
  templates: PromptTemplate[];
}).templates;

const defaults = (
  indexData as unknown as {
    form_default_selection: {
      style: string;
      space: string;
      lighting: string;
      season: string;
      weather: string;
      camera_body: string;
      camera_lens: string;
      camera_aperture: string;
      camera_iso: string;
      composition_perspective: string;
      composition_shot: string;
      ratio: string;
      quality_modifiers_default: string[];
      negative_default: string[];
      template: string;
    };
  }
).form_default_selection;

// ----------------- helpers ----------------- //

export function findById<T extends { id: string }>(
  arr: readonly T[] | undefined,
  id: string | null | undefined,
): T | undefined {
  if (!arr || !id) return undefined;
  return arr.find((x) => x.id === id);
}

export function findByIds<T extends { id: string }>(
  arr: readonly T[] | undefined,
  ids: readonly string[] | undefined,
): T[] {
  if (!arr || !ids?.length) return [];
  return ids.map((id) => arr.find((x) => x.id === id)).filter(Boolean) as T[];
}

export function buildDefaultFormState(): FormState {
  return {
    template: defaults.template,
    space: defaults.space,
    style: defaults.style,
    materials: [],
    colors: [],
    furniture: [],
    lighting: defaults.lighting,
    season: defaults.season,
    weather: defaults.weather,
    composition: {
      perspective: defaults.composition_perspective,
      shot: defaults.composition_shot,
    },
    ratio: defaults.ratio,
    camera: {
      body: defaults.camera_body,
      lens: defaults.camera_lens,
      aperture: defaults.camera_aperture,
      iso: defaults.camera_iso,
    },
    mood: [],
    artist: null,
    qualityModifiers: [...defaults.quality_modifiers_default],
    negativeGroups: [...defaults.negative_default],
    freeText: "",
  };
}

// ----------------- exported vocab namespace ----------------- //

export const vocab = {
  styles,
  spaces,
  materials,
  lighting,
  seasons,
  weather,
  camera,
  composition,
  colors,
  moods,
  furniture,
  artists,
  qualityModifiers,
  negativePresets,
  templates,
} as const;

export const vocabMeta = {
  version: (indexData as unknown as { vocabulary_version?: string }).vocabulary_version ?? "1.0.0",
  buildDate: (indexData as unknown as { build_date?: string }).build_date ?? "",
  totals:
    (indexData as unknown as { totals?: { total_items_approx?: number; files?: number } }).totals ??
    {},
};

export type Vocab = typeof vocab;
