"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import { buildDefaultFormState } from "./vocab";
import type { FormAction, FormState } from "./types";

// ----------------- reducer ----------------- //

function reducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD": {
      return { ...state, [action.field]: action.value };
    }
    case "SET_NESTED": {
      const [group, key] = action.path;
      return {
        ...state,
        [group]: {
          ...(state[group] as Record<string, unknown>),
          [key]: action.value,
        },
      };
    }
    case "TOGGLE_MULTI": {
      const current = state[action.field];
      if (!Array.isArray(current)) return state;
      const arr = current as string[];
      const isSelected = arr.includes(action.id);
      let next: string[];
      if (isSelected) {
        next = arr.filter((x) => x !== action.id);
      } else {
        next = [...arr, action.id];
        if (action.max && next.length > action.max) {
          // drop oldest item to respect cap
          next = next.slice(next.length - action.max);
        }
      }
      return { ...state, [action.field]: next };
    }
    case "RESET": {
      return buildDefaultFormState();
    }
    default:
      return state;
  }
}

// ----------------- context ----------------- //

interface FormContextValue {
  state: FormState;
  setField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  setNested: (group: "composition" | "camera", key: string, value: string) => void;
  toggleMulti: (field: keyof FormState, id: string, max?: number) => void;
  reset: () => void;
  proMode: boolean;
  setProMode: (v: boolean) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

// ----------------- provider ----------------- //

export function FormProvider({
  children,
  initialProMode = false,
}: {
  children: ReactNode;
  initialProMode?: boolean;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, buildDefaultFormState);
  const [proMode, setProMode] = useReducer(
    (_: boolean, next: boolean) => next,
    initialProMode,
  );

  const value = useMemo<FormContextValue>(
    () => ({
      state,
      setField: (field, value) =>
        dispatch({ type: "SET_FIELD", field, value }),
      setNested: (group, key, value) =>
        dispatch({ type: "SET_NESTED", path: [group, key], value }),
      toggleMulti: (field, id, max) =>
        dispatch({ type: "TOGGLE_MULTI", field, id, max }),
      reset: () => dispatch({ type: "RESET" }),
      proMode,
      setProMode,
    }),
    [state, proMode],
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

// ----------------- hook ----------------- //

export function useForm() {
  const ctx = useContext(FormContext);
  if (!ctx) {
    throw new Error("useForm must be used within FormProvider");
  }
  return ctx;
}
