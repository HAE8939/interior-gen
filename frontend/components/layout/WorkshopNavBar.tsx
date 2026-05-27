"use client";

/**
 * WorkshopNavBar
 * ──────────────
 * Sticky tab-switcher for the 提示词工坊 page.
 * Sits below the main page tab bar; clicking a tab instantly swaps the
 * visible content panel — no scrolling required.
 *
 * Left group  : 基础选项 · 进阶选项 · 专业模式 · 自由输入
 * Right group : Prompt 预览 · 运行日志
 */

import * as React from "react";
import { useForm } from "@/lib/form-context";

// ─── Nav items ─────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  group: "form" | "right";
  proOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "section-basic",    label: "基础选项",    group: "form"  },
  { id: "section-advanced", label: "进阶选项",    group: "form"  },
  { id: "section-pro",      label: "专业模式",    group: "form", proOnly: true },
  { id: "section-freetext", label: "自由输入",    group: "form"  },
  { id: "section-preview",  label: "Prompt 预览", group: "right" },
  { id: "section-devtools", label: "运行日志",    group: "right" },
];

// ─── Props ─────────────────────────────────────────────────────────────────────

interface WorkshopNavBarProps {
  activeId: string;
  onNavigate: (id: string) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function WorkshopNavBar({ activeId, onNavigate }: WorkshopNavBarProps) {
  const { proMode } = useForm();

  const visibleItems = React.useMemo(
    () => NAV_ITEMS.filter((item) => !item.proOnly || proMode),
    [proMode],
  );

  // If the active tab is proOnly but proMode just turned off, fall back gracefully.
  React.useEffect(() => {
    const current = NAV_ITEMS.find((i) => i.id === activeId);
    if (current?.proOnly && !proMode) {
      onNavigate("section-basic");
    }
  }, [proMode, activeId, onNavigate]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <nav
      aria-label="工坊快速导航"
      className="sticky z-[9] bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b border-border/40"
      style={{ top: "3rem" }}
    >
      {/* Inner row — max-width matches the page container */}
      <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleItems.map((item, i) => {
            const isActive = activeId === item.id;
            const prevItem = visibleItems[i - 1];
            const showSep = item.group === "right" && prevItem?.group === "form";

            return (
              <React.Fragment key={item.id}>
                {/* Vertical divider between form ↔ right group */}
                {showSep && (
                  <div className="mx-2 h-3.5 w-px shrink-0 bg-border/60" aria-hidden />
                )}

                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={[
                    "relative shrink-0 whitespace-nowrap cn",
                    "flex items-center px-2.5 sm:px-3 py-2.5",
                    "text-xs font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {item.label}

                  {/* Active underline — same style as page-level tab bar */}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
