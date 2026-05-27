"use client";

import * as React from "react";

import { FormShell } from "@/components/form/FormShell";
import { ScenePresetsPanel } from "@/components/form/ScenePresetsPanel";
import { ConfigBar } from "@/components/layout/ConfigBar";
import { Header } from "@/components/layout/Header";
import { WorkshopNavBar } from "@/components/layout/WorkshopNavBar";
import { ErrorLog } from "@/components/preview/ErrorLog";
import { FormStateJson } from "@/components/preview/FormStateJson";
import { ImageStudio } from "@/components/preview/ImageStudio";
import { PromptPreview } from "@/components/preview/PromptPreview";

// ─── Top-level page tabs ─────────────────────────────────────────────────────

type PageTab = "prompt-workshop" | "image-studio";

const PAGE_TABS: { id: PageTab; label: string; icon: string }[] = [
  { id: "prompt-workshop", label: "提示词工坊", icon: "✦" },
  { id: "image-studio",    label: "生图工作台", icon: "◈" },
];

// ─── Section IDs that map to the form ────────────────────────────────────────

const FORM_SECTION_IDS = [
  "section-basic",
  "section-advanced",
  "section-pro",
  "section-freetext",
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [activePage, setActivePage] = React.useState<PageTab>("prompt-workshop");
  const [workshopSection, setWorkshopSection] = React.useState<string>("section-basic");

  const handleGoToPromptWorkshop = React.useCallback(() => {
    setActivePage("prompt-workshop");
  }, []);

  return (
    <>
      {/* ── Floating settings button (bottom-right) ── */}
      <ConfigBar />

      {/* ── Page navigation: 提示词工坊 | 生图工作台 ── */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0">
            {PAGE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePage(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 sm:px-5 py-3.5 text-sm font-medium transition-colors cn ${
                  activePage === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-primary opacity-80 text-xs">{tab.icon}</span>
                {tab.label}
                {activePage === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/*
       * ── WorkshopNavBar ──
       * 紧贴在 PageNav 下方、content div 之外，始终固定可见。
       * 仅在提示词工坊 tab 下显示；切换到生图工作台时整行消失。
       */}
      {activePage === "prompt-workshop" && (
        <WorkshopNavBar
          activeId={workshopSection}
          onNavigate={setWorkshopSection}
        />
      )}

      {/* ── Main content ── */}
      <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8 pt-5 pb-8">

        {/* ─ Tab A: 提示词工坊 ─ */}
        <div className={activePage === "prompt-workshop" ? "block" : "hidden"}>

          {/* Form sections (CSS show/hide preserves state) */}
          <div className={FORM_SECTION_IDS.includes(workshopSection) ? "block" : "hidden"}>

            {/* 基础选项 Tab 顶部：应用标题 + 场景灵感预设 */}
            {workshopSection === "section-basic" && (
              <div className="mb-6 space-y-5">
                <Header />
                <ScenePresetsPanel />
              </div>
            )}

            <FormShell activeSection={workshopSection} />
          </div>

          {/* Prompt 预览 Tab */}
          <div className={workshopSection === "section-preview" ? "block" : "hidden"}>
            <PromptPreview />
          </div>

          {/* 运行日志 Tab */}
          <div className={workshopSection === "section-devtools" ? "block" : "hidden"}>
            <div className="space-y-3">
              <FormStateJson />
              <ErrorLog />
            </div>
          </div>

        </div>

        {/* ─ Tab B: 生图工作台 ─ */}
        <div className={activePage === "image-studio" ? "block" : "hidden"}>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight cn">生图工作台</h2>
              <p className="text-sm text-muted-foreground cn mt-1">
                基于
                <button
                  type="button"
                  onClick={() => setActivePage("prompt-workshop")}
                  className="text-primary hover:underline mx-1 cn"
                >
                  提示词工坊
                </button>
                的参数配置，支持文生图、改图与白膜赋材三种工作流。
              </p>
            </div>

            <ImageStudio onGoToPromptWorkshop={handleGoToPromptWorkshop} />
            <ErrorLog />
          </div>
        </div>

      </div>
    </>
  );
}
