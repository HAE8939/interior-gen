"use client";

/**
 * SettingsProvider
 * ─────────────────
 * 配置加载优先级（从高到低）：
 *   1. localStorage（用户在设置面板手动填写并保存，浏览器本地持久化）
 *   2. 服务端返回值（Vercel 环境变量 或 本地 api-config.json）
 *   3. 默认空值
 *
 * 保存时：
 *   - 始终写入 localStorage（本地浏览器，所有环境均有效）
 *   - 同时 POST /api/config（本地开发写文件；Vercel 静默返回 ok，不抛错）
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LLMSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ImageGenSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AppSettings {
  llm: LLMSettings;
  imageGen: ImageGenSettings;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

function defaultSettings(): AppSettings {
  return {
    llm:      { apiKey: "", baseUrl: "", model: "" },
    imageGen: { apiKey: "", baseUrl: "", model: "gpt-image-2" },
  };
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = "prompt_draw_settings_v1";

function lsLoad(): Partial<AppSettings> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Partial<AppSettings>) : null;
  } catch {
    return null;
  }
}

function lsSave(s: AppSettings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    // ignore storage quota errors
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SettingsContextValue {
  settings: AppSettings;
  hydrated: boolean;
  updateLLM: (patch: Partial<LLMSettings>) => void;
  updateImageGen: (patch: Partial<ImageGenSettings>) => void;
  /** 保存配置（localStorage + 服务端文件，均失败时仅 localStorage） */
  save: () => Promise<void>;
  isLLMConfigured: boolean;
  isImageGenConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  // ── 启动时加载配置 ──────────────────────────────────────────────────────────
  useEffect(() => {
    const ls = lsLoad();

    fetch("/api/config")
      .then((r) => r.json() as Promise<AppSettings & { source?: string }>)
      .then((server) => {
        // 合并：localStorage 非空字段优先（用户手动配置 > 服务端默认值）
        setSettings({
          llm: {
            apiKey:  ls?.llm?.apiKey  || server.llm?.apiKey  || "",
            baseUrl: ls?.llm?.baseUrl || server.llm?.baseUrl || "",
            model:   ls?.llm?.model   || server.llm?.model   || "",
          },
          imageGen: {
            apiKey:  ls?.imageGen?.apiKey  || server.imageGen?.apiKey  || "",
            baseUrl: ls?.imageGen?.baseUrl || server.imageGen?.baseUrl || "",
            model:   ls?.imageGen?.model   || server.imageGen?.model   || "gpt-image-2",
          },
        });
      })
      .catch(() => {
        // 服务端不可达 — 回退到 localStorage 或默认值
        if (ls) {
          setSettings({
            llm:      { ...defaultSettings().llm,      ...(ls.llm      ?? {}) },
            imageGen: { ...defaultSettings().imageGen, ...(ls.imageGen ?? {}) },
          });
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  // ── 局部更新 ──────────────────────────────────────────────────────────────
  const updateLLM = useCallback((patch: Partial<LLMSettings>) => {
    setSettings((prev) => ({ ...prev, llm: { ...prev.llm, ...patch } }));
  }, []);

  const updateImageGen = useCallback((patch: Partial<ImageGenSettings>) => {
    setSettings((prev) => ({
      ...prev,
      imageGen: { ...prev.imageGen, ...patch },
    }));
  }, []);

  // ── 保存 ──────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    // 捕获当前最新值（functional update 模式）
    let captured: AppSettings = defaultSettings();
    setSettings((prev) => {
      captured = prev;
      return prev;
    });

    // 1. 始终写入 localStorage（本地浏览器，所有环境有效）
    lsSave(captured);

    // 2. 尝试写入服务端文件（本地开发有效；Vercel 返回 ok + persisted:"browser"）
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(captured),
      });
      // 仅在真正非 2xx 时抛错（当前实现不会出现 non-ok，保留兜底）
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? `保存失败 (${res.status})`);
      }
    } catch (e) {
      // 服务端保存失败无需抛出——localStorage 已保存，功能正常
      console.warn("[settings] 服务端保存跳过，配置已存入浏览器本地:", e);
    }
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────
  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      hydrated,
      updateLLM,
      updateImageGen,
      save,
      isLLMConfigured:      settings.llm.apiKey.trim().length > 0,
      isImageGenConfigured: settings.imageGen.apiKey.trim().length > 0,
    }),
    [settings, hydrated, updateLLM, updateImageGen, save],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
