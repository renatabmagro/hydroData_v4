import { create } from "zustand";

interface AnalysisState {
  isRunning: boolean;
  result: unknown | null;
  error: string | null;

  setRunning: (value: boolean) => void;
  setResult: (result: unknown) => void;
  setError: (error: string | null) => void;

  reset: () => void;
}

export const useAnalysisStore =
  create<AnalysisState>((set) => ({
    isRunning: false,
    result: null,
    error: null,

    setRunning: (value) =>
      set({
        isRunning: value
      }),

    setResult: (result) =>
      set({
        result
      }),

    setError: (error) =>
      set({
        error
      }),

    reset: () =>
      set({
        isRunning: false,
        result: null,
        error: null
      })
  }));