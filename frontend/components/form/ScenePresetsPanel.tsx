"use client";

/**
 * ScenePresetsPanel
 * ─────────────────
 * A horizontally-scrollable strip of scene preset cards.
 *
 * Built-in presets:  curated cards loaded from vocabulary/scene_presets.json
 * Custom presets:    saved to / loaded from localStorage key "prompt_draw_custom_presets"
 *                    Each card captures the current form state on creation.
 *                    Displayed after built-in presets, with a delete button.
 * "+" card:          always at the end — opens an inline naming field.
 */

import * as React from "react";
import { Sparkles, Plus, X, Check } from "lucide-react";
import scenePresetsData from "@vocab/scene_presets.json";
import { useForm } from "@/lib/form-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScenePresetFormValues {
  template: string;
  style: string;
  space: string;
  lighting: string;
  season: string;
  weather: string;
  mood: string[];
  materials?: string[];
  ratio: string;
}

interface ScenePreset {
  id: string;
  name_zh: string;
  name_en: string;
  emoji: string;
  color_from: string;
  color_to: string;
  description_zh: string;
  form_values: ScenePresetFormValues;
}

interface CustomPreset extends ScenePreset {
  isCustom: true;
}

// ─── Built-in presets ────────────────────────────────────────────────────────

const BUILTIN_PRESETS = (
  scenePresetsData as unknown as { presets: ScenePreset[] }
).presets;

// ─── Custom preset helpers ────────────────────────────────────────────────────

const STORAGE_KEY = "prompt_draw_custom_presets";

const CUSTOM_GRADIENTS = [
  { from: "#e8d5f5", to: "#c4a0de" },
  { from: "#d5e8f5", to: "#99c4e8" },
  { from: "#d5f5e8", to: "#99e0c4" },
  { from: "#f5e8d5", to: "#e0c4a0" },
  { from: "#f5d5e8", to: "#e0a0c4" },
  { from: "#f0f5d5", to: "#c4d88a" },
  { from: "#d5eef5", to: "#88cce0" },
  { from: "#f5ead5", to: "#e0c090" },
];

const CUSTOM_EMOJIS = ["🏠", "🎨", "✨", "🌿", "💎", "🕯️", "🌙", "☀️", "🪴", "🛋️"];

function loadCustomPresets(): CustomPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomPreset[];
  } catch {
    return [];
  }
}

function saveCustomPresets(presets: CustomPreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // ignore quota errors
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScenePresetsPanel() {
  const { state, setField } = useForm();
  const [appliedId, setAppliedId] = React.useState<string | null>(null);

  // ── Custom presets state ─────────────────────────────────────────────────
  const [customPresets, setCustomPresets] = React.useState<CustomPreset[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  React.useEffect(() => {
    setCustomPresets(loadCustomPresets());
  }, []);

  // Focus input when creation panel opens
  React.useEffect(() => {
    if (isCreating) {
      nameInputRef.current?.focus();
    }
  }, [isCreating]);

  // ── Apply any preset ──────────────────────────────────────────────────────
  function applyPreset(preset: ScenePreset) {
    const fv = preset.form_values;
    setField("template", fv.template);
    setField("style", fv.style);
    setField("space", fv.space);
    setField("lighting", fv.lighting);
    setField("season", fv.season);
    setField("weather", fv.weather);
    setField("mood", fv.mood);
    setField("materials", fv.materials ?? []);
    setField("ratio", fv.ratio);
    setAppliedId(preset.id);
    setTimeout(
      () => setAppliedId((prev) => (prev === preset.id ? null : prev)),
      2000,
    );
  }

  // ── Save new custom preset ────────────────────────────────────────────────
  function saveCustomPreset() {
    const trimmed = newName.trim();
    if (!trimmed) {
      setIsCreating(false);
      setNewName("");
      return;
    }

    const idx = customPresets.length % CUSTOM_GRADIENTS.length;
    const emojiIdx = customPresets.length % CUSTOM_EMOJIS.length;
    const grad = CUSTOM_GRADIENTS[idx];

    const preset: CustomPreset = {
      id: `custom-${Date.now()}`,
      name_zh: trimmed,
      name_en: trimmed,
      emoji: CUSTOM_EMOJIS[emojiIdx],
      color_from: grad.from,
      color_to: grad.to,
      description_zh: "自定义场景",
      isCustom: true,
      form_values: {
        template: state.template as string,
        style: state.style as string,
        space: state.space as string,
        lighting: state.lighting as string,
        season: state.season as string,
        weather: state.weather as string,
        mood: state.mood as string[],
        materials: state.materials as string[],
        ratio: state.ratio as string,
      },
    };

    const updated = [...customPresets, preset];
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setIsCreating(false);
    setNewName("");
    // Show "applied" feedback immediately
    setAppliedId(preset.id);
    setTimeout(() => setAppliedId((prev) => (prev === preset.id ? null : prev)), 1500);
  }

  // ── Delete a custom preset ────────────────────────────────────────────────
  function deleteCustomPreset(id: string, e: React.MouseEvent) {
    e.stopPropagation(); // don't apply the preset when deleting
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    saveCustomPresets(updated);
  }

  // ── Keyboard handlers for new-preset input ────────────────────────────────
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") saveCustomPreset();
    if (e.key === "Escape") {
      setIsCreating(false);
      setNewName("");
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary shrink-0" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight cn">场景灵感预设</h3>
            <p className="text-xs text-muted-foreground cn">
              点击任意场景一键填充表单，再按需微调
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable card strip */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-2.5" style={{ minWidth: "max-content" }}>

          {/* ─ Built-in presets ─ */}
          {BUILTIN_PRESETS.map((preset) => {
            const isApplied = appliedId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`
                  group relative flex-shrink-0 w-36 rounded-xl overflow-hidden
                  border text-left transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]
                  ${isApplied
                    ? "border-primary shadow-md -translate-y-0.5"
                    : "border-border/40 hover:border-primary/50"}
                `}
                style={{
                  background: `linear-gradient(140deg, ${preset.color_from} 0%, ${preset.color_to} 100%)`,
                }}
                title={preset.name_en}
              >
                <div className="p-3 space-y-1.5">
                  <div className="text-2xl leading-none">{preset.emoji}</div>
                  <p className="text-[11px] font-semibold cn text-foreground/90 leading-snug">
                    {preset.name_zh}
                  </p>
                  <p className="text-[10px] text-foreground/55 cn leading-relaxed line-clamp-3">
                    {preset.description_zh}
                  </p>
                </div>
                {isApplied && (
                  <div className="absolute inset-x-0 bottom-0 bg-primary/90 py-1 text-center">
                    <span className="text-[9px] font-semibold text-primary-foreground cn tracking-wide">
                      ✓ 已套用
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none" />
              </button>
            );
          })}

          {/* ─ Custom presets ─ */}
          {customPresets.map((preset) => {
            const isApplied = appliedId === preset.id;
            return (
              <div key={preset.id} className="relative flex-shrink-0 w-36">
                <button
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`
                    group w-full rounded-xl overflow-hidden
                    border text-left transition-all duration-200
                    hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]
                    ${isApplied
                      ? "border-primary shadow-md -translate-y-0.5"
                      : "border-dashed border-border/60 hover:border-primary/50"}
                  `}
                  style={{
                    background: `linear-gradient(140deg, ${preset.color_from} 0%, ${preset.color_to} 100%)`,
                  }}
                >
                  <div className="p-3 space-y-1.5">
                    <div className="text-2xl leading-none">{preset.emoji}</div>
                    <p className="text-[11px] font-semibold cn text-foreground/90 leading-snug pr-4">
                      {preset.name_zh}
                    </p>
                    <p className="text-[10px] text-foreground/50 cn">
                      自定义
                    </p>
                  </div>
                  {isApplied && (
                    <div className="absolute inset-x-0 bottom-0 bg-primary/90 py-1 text-center">
                      <span className="text-[9px] font-semibold text-primary-foreground cn tracking-wide">
                        ✓ 已套用
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none" />
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => deleteCustomPreset(preset.id, e)}
                  className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
                  title="删除预设"
                  aria-label={`删除预设：${preset.name_zh}`}
                >
                  <X className="size-2.5 text-white" />
                </button>
              </div>
            );
          })}

          {/* ─ "新建预设" card ─ */}
          {isCreating ? (
            /* Inline naming form */
            <div
              className="flex-shrink-0 w-36 rounded-xl border border-dashed border-primary/60 bg-card/80 p-3 space-y-2 flex flex-col"
              style={{ minHeight: "120px" }}
            >
              <div className="text-xl">💾</div>
              <input
                ref={nameInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="输入名称…"
                maxLength={12}
                className="w-full bg-transparent border-b border-border/60 focus:border-primary outline-none text-[11px] cn py-0.5 text-foreground placeholder:text-muted-foreground/60"
              />
              <div className="flex gap-1 mt-auto">
                <button
                  type="button"
                  onClick={saveCustomPreset}
                  className="flex-1 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                  title="保存"
                >
                  <Check className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setNewName(""); }}
                  className="flex-1 h-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center hover:bg-accent transition-colors"
                  title="取消"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
          ) : (
            /* "+" button card */
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="
                flex-shrink-0 w-36 rounded-xl border border-dashed border-border/50
                bg-card/40 hover:bg-card/80 hover:border-primary/40
                transition-all duration-200 hover:-translate-y-0.5
                flex flex-col items-center justify-center gap-2 p-3
              "
              style={{ minHeight: "120px" }}
              title="保存当前配置为自定义预设"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Plus className="size-4 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground cn text-center leading-snug">
                保存为<br />自定义预设
              </p>
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
