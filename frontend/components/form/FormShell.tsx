"use client";

import { useForm } from "@/lib/form-context";
import { vocab } from "@/lib/vocab";

import { ArtistSelect } from "./ArtistSelect";
import { CameraGroup } from "./CameraGroup";
import { CompositionGroup } from "./CompositionGroup";
import { FreeTextArea } from "./FreeTextArea";
import { LightingGrid } from "./LightingGrid";
import { MultiSelectChips } from "./MultiSelectChips";
import { NegativeGroup } from "./NegativeGroup";
import { PaletteGrid } from "./PaletteGrid";
import { Field, Section } from "./Section";
import { SingleSelectCards } from "./SingleSelectCards";
import { SingleSelectDropdown } from "./SingleSelectDropdown";
import { TemplateSelect } from "./TemplateSelect";

export function FormShell({ activeSection }: { activeSection?: string } = {}) {
  const { state, setField, toggleMulti, proMode } = useForm();

  // When activeSection is set, show only the matching section; otherwise show all.
  const show = (id: string) => !activeSection || activeSection === id;

  return (
    <div className="space-y-4">

      {/* ============ TIER 1 · 必填 ============ */}
      <div className={show("section-basic") ? "block" : "hidden"}>
        <Section id="section-basic" title="基础选项" subtitle="必填·一眼可见" badge="必填" defaultOpen>
          <Field label="空间类型" hint={`${vocab.spaces.length} 种`}>
            <SingleSelectCards
              options={vocab.spaces}
              value={state.space}
              onChange={(v) => setField("space", v)}
              cols={4}
              showDescription={false}
            />
          </Field>

          <Field label="设计风格" hint={`${vocab.styles.length} 种`}>
            <SingleSelectCards
              options={vocab.styles}
              value={state.style}
              onChange={(v) => setField("style", v)}
              cols={4}
            />
          </Field>

          <Field label="光影氛围" hint={`${vocab.lighting.length} 种 · 网格选择`}>
            <LightingGrid
              options={vocab.lighting}
              value={state.lighting}
              onChange={(v) => setField("lighting", v)}
            />
          </Field>

          <Field label="画幅比例" hint={`${vocab.composition.ratios.length} 种`}>
            <div className="flex flex-wrap gap-2">
              {vocab.composition.ratios.map((r) => {
                const selected = r.id === state.ratio;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setField("ratio", r.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-all ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/70 bg-card hover:border-primary/40"
                    }`}
                  >
                    {r.name_zh}
                  </button>
                );
              })}
            </div>
          </Field>
        </Section>
      </div>

      {/* ============ TIER 2 · 推荐 ============ */}
      <div className={show("section-advanced") ? "block" : "hidden"}>
        <Section id="section-advanced" title="进阶选项" subtitle="推荐·建议补充以获得更精准的输出" badge="推荐" defaultOpen>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="季节" hint={`${vocab.seasons.length} 项`}>
              <SingleSelectDropdown
                options={vocab.seasons}
                value={state.season}
                onChange={(v) => setField("season", v)}
              />
            </Field>
            <Field label="天气" hint={`${vocab.weather.length} 项`}>
              <SingleSelectDropdown
                options={vocab.weather}
                value={state.weather}
                onChange={(v) => setField("weather", v)}
              />
            </Field>
          </div>

          <Field label="主要材质" hint="建议 2–5 个">
            <MultiSelectChips
              options={vocab.materials}
              value={state.materials}
              onToggle={(id) => toggleMulti("materials", id, 5)}
              min={2}
              max={5}
            />
          </Field>

          <Field label="主要家具" hint="建议 3–6 个">
            <MultiSelectChips
              options={vocab.furniture}
              value={state.furniture}
              onToggle={(id) => toggleMulti("furniture", id, 6)}
              min={3}
              max={6}
            />
          </Field>

          <Field label="配色方案" hint={`${vocab.colors.palettes.length} 套`}>
            <PaletteGrid
              options={vocab.colors.palettes}
              value={state.colors}
              onToggle={(id) => toggleMulti("colors", id, 2)}
              max={2}
            />
          </Field>

          <Field label="氛围词" hint="建议 1–3 个">
            <MultiSelectChips
              options={vocab.moods}
              value={state.mood}
              onToggle={(id) => toggleMulti("mood", id, 3)}
              min={1}
              max={3}
            />
          </Field>
        </Section>
      </div>

      {/* ============ TIER 3 · 专业模式 ============ */}
      <div className={show("section-pro") ? "block" : "hidden"}>
        <Section
          id="section-pro"
          title="专业模式"
          subtitle="摄影 / 构图 / 设计师 / 画质 / 负向词 / 模板"
          badge="专业"
          defaultOpen={false}
          hidden={!proMode}
        >
          <Field label="Prompt 模板">
            <TemplateSelect />
          </Field>

          <Field label="摄影参数">
            <CameraGroup />
          </Field>

          <Field label="构图视角">
            <CompositionGroup />
          </Field>

          <Field label="参考设计师/摄影师" hint="可选">
            <ArtistSelect />
          </Field>

          <Field label="画质修饰词" hint={`${vocab.qualityModifiers.length} 项 · 高优先级默认勾选`}>
            <MultiSelectChips
              options={vocab.qualityModifiers}
              value={state.qualityModifiers}
              onToggle={(id) => toggleMulti("qualityModifiers", id)}
            />
          </Field>

          <Field label="负向词预设">
            <NegativeGroup />
          </Field>
        </Section>
      </div>

      {/* ============ 自由输入 ============ */}
      <div className={show("section-freetext") ? "block" : "hidden"}>
        <Section id="section-freetext" title="自由输入" subtitle="任何补充需求，LLM 会翻译并融入" badge="补充" defaultOpen>
          <FreeTextArea />
        </Section>
      </div>

    </div>
  );
}
