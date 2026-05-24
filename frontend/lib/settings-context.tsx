"use client";

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
    imageGen: { apiKey: "", baseUrl: "https://api.example.com", model: "gpt-image-2" },
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SettingsContextValue {
  settings: AppSettings;
  hydrated: boolean;
  updateLLM: (patch: Partial<LLMSettings>) => void;
  updateImageGen: (patch: Partial<ImageGenSettings>) => void;
  /** Persist current settings to api-config.json. Throws on failure. */
  save: () => Promise<void>;
  isLLMConfigured: boolean;
  isImageGenConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hydrated, setHydrated]  = useState(false);

  // Load from file on mount
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json() as Promise<AppSettings>)
      .then((data) => {
        setSettings(data);
        setHydrated(true);
      })
      .catch(() => {
        // Server unreachable — keep defaults, still mark hydrated
        setHydrated(true);
      });
  }, []);

  const updateLLM = useCallback((patch: Partial<LLMSettings>) => {
    setSettings((prev) => ({ ...prev, llm: { ...prev.llm, ...patch } }));
  }, []);

  const updateImageGen = useCallback((patch: Partial<ImageGenSettings>) => {
    setSettings((prev) => ({ ...prev, imageGen: { ...prev.imageGen, ...patch } }));
  }, []);

  const save = useCallback(async () => {
    // Capture latest value from functional-update pattern
    let captured: AppSettings = defaultSettings();
    setSettings((prev) => { captured = prev; return prev; });

    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(captured),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(json.error ?? `保存失败 (${res.status})`);
    }
  }, []);

  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    hydrated,
    updateLLM,
    updateImageGen,
    save,
    isLLMConfigured:    settings.llm.apiKey.trim().length > 0,
    isImageGenConfigured: settings.imageGen.apiKey.trim().length > 0,
  }), [settings, hydrated, updateLLM, updateImageGen, save]);

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
