import { emptyState, parseState, type State } from "./model";
export const STORAGE_KEY = "studysprint-v1";
export function loadState(): { state: State; error: string; blocked: boolean } {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return {
      state: value ? parseState(JSON.parse(value)) : emptyState(),
      error: "",
      blocked: false,
    };
  } catch {
    return {
      state: emptyState(),
      error:
        "Saved data could not be read. It has been preserved. Restore a valid backup or explicitly reset storage before making changes.",
      blocked: true,
    };
  }
}
export function persistState(state: State): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
