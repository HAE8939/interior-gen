/**
 * Type contracts for the vocabulary library and the form state.
 *
 * These mirror what's declared in `vocabulary/_schema.md`. We keep them
 * intentionally permissive (lots of `string[]` and `string | null`) so that
 * adding new optional fields to the vocab JSON does not break the build.
 */

// ----------------- base vocab item ----------------- //

export type Tag = string;

/** Common fields every vocab entry carries. */
export interface VocabItem {
  id: string;
  name_zh: string;
  name_en: string;
  keywords_en?: readonly string[];
  description_zh?: string;
  tags?: readonly Tag[];
  weight?: number;
}

// ----------------- type-specific extensions ----------------- //

export interface StyleItem extends VocabItem {
  era?: string;
  region?: string;
  key_features?: readonly string[];
  signature_colors?: readonly string[];
  signature_materials?: readonly string[];
  compatible_styles?: readonly string[];
}

export interface SpaceItem extends VocabItem {
  category?: string;
  typical_furniture?: readonly string[];
  default_ratio?: string;
}

export interface MaterialItem extends VocabItem {
  category?: string;
  feel?: string | readonly string[];
}

export interface LightingItem extends VocabItem {
  time_of_day?: "morning" | "afternoon" | "dusk" | "night" | "any" | string;
  mood?: string;
  preview_prompt_en?: string;
  pairs_well_with?: readonly string[];
}

export interface SeasonItem extends VocabItem {
  mood?: string;
}

export interface WeatherItem extends VocabItem {
  /** placeholder for future weather-specific fields (e.g. visibility, humidity) */
  intensity?: string;
}

export interface CameraItem extends VocabItem {
  type?: string;
}

export interface CompositionItem extends VocabItem {
  category?: string;
}

export interface RatioItem extends VocabItem {
  /** Midjourney --ar value, e.g. "16:9" */
  mj_param?: string;
  /** width/height numeric (optional, for SD/Flux) */
  width?: number;
  height?: number;
}

export interface ColorItem extends VocabItem {
  hex?: string;
}

export interface PaletteItem extends VocabItem {
  palette?: readonly string[]; // array of hex colors
  mood?: string;
  compatible_styles?: readonly string[];
}

export interface MoodItem extends VocabItem {
  category?: string;
}

export interface FurnitureItem extends VocabItem {
  category?: string;
}

export interface ArtistItem extends VocabItem {
  discipline?: string;
  era?: string;
  style_keywords?: readonly string[];
}

export interface QualityModifierItem extends VocabItem {
  priority?: "high" | "medium" | "low";
}

export interface NegativePreset {
  name_zh: string;
  description_zh?: string;
  keywords_en: readonly string[];
}

export interface PromptTemplate {
  id: string;
  name_zh: string;
  name_en: string;
  description_zh?: string;
  target_models?: readonly string[];
  structure_zh?: string;
  template_en: string;
  template_midjourney_suffix?: string;
  example_output_en?: string;
  tags?: readonly string[];
}

// ----------------- form state (what the UI emits) ----------------- //

export interface FormState {
  template: string;
  space: string;
  style: string;
  materials: string[];
  /** ids referring to palettes (could be single_colors in future) */
  colors: string[];
  furniture: string[];
  lighting: string;
  season: string;
  weather: string;
  composition: {
    perspective: string;
    shot: string;
  };
  ratio: string;
  camera: {
    body: string;
    lens: string;
    aperture: string;
    iso: string;
  };
  mood: string[];
  artist: string | null;
  qualityModifiers: string[];
  negativeGroups: string[];
  freeText: string;
}

// ----------------- form mutation actions ----------------- //

export type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: "SET_NESTED"; path: ["composition" | "camera", string]; value: string }
  | { type: "TOGGLE_MULTI"; field: keyof FormState; id: string; max?: number }
  | { type: "RESET" };

// ----------------- assembler output ----------------- //

export interface AssembledPrompt {
  prompt_en: string;
  mj_suffix: string;
  negative_prompt: string;
  /** the chosen template id for reference */
  template_id: string;
  /** warnings/notes raised during assembly (missing fields etc.) */
  notes: string[];
}
