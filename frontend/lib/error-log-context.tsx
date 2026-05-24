"use client";

import * as React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogLevel = "error" | "warn" | "info";

export interface LogEntry {
  id: number;
  ts: Date;
  level: LogLevel;
  source: string;
  message: string;
}

interface ErrorLogContextValue {
  entries: LogEntry[];
  log: (level: LogLevel, source: string, message: string) => void;
  clear: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ErrorLogContext = React.createContext<ErrorLogContextValue | null>(null);

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "ADD"; entry: Omit<LogEntry, "id"> }
  | { type: "CLEAR" };

let nextId = 1;

function reducer(state: LogEntry[], action: Action): LogEntry[] {
  switch (action.type) {
    case "ADD":
      return [...state, { ...action.entry, id: nextId++ }];
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ErrorLogProvider({ children }: { children: React.ReactNode }) {
  const [entries, dispatch] = React.useReducer(reducer, []);

  const log = React.useCallback((level: LogLevel, source: string, message: string) => {
    dispatch({ type: "ADD", entry: { ts: new Date(), level, source, message } });
  }, []);

  const clear = React.useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const value = React.useMemo(() => ({ entries, log, clear }), [entries, log, clear]);

  return (
    <ErrorLogContext.Provider value={value}>
      {children}
    </ErrorLogContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useErrorLog(): ErrorLogContextValue {
  const ctx = React.useContext(ErrorLogContext);
  if (!ctx) throw new Error("useErrorLog must be used inside <ErrorLogProvider>");
  return ctx;
}
