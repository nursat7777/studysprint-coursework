import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { backupJson, demoState, MAX_BACKUP_BYTES } from "./BackupPanel";
import { emptyState, parseState, saveTask } from "./model";
import App from "./App";
import { STORAGE_KEY } from "./storage";
function upload(text: string, size = text.length) {
  const file = { size, text: () => Promise.resolve(text) };
  fireEvent.change(screen.getByLabelText("Import backup"), {
    target: { files: [file] },
  });
}
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
describe("backup schema", () => {
  it("roundtrips blank and complete data and canonicalizes imported text", () => {
    expect(parseState(JSON.parse(backupJson(emptyState())))).toEqual(
      emptyState(),
    );
    const state = demoState(emptyState());
    state.tasks[0].title = "  Trimmed  ";
    const parsed = parseState(JSON.parse(backupJson(state)));
    expect(parsed.tasks[0].title).toBe("Trimmed");
    expect(parsed.tasks[0].id).toBe(state.tasks[0].id);
  });
  it("rejects invalid nested records, versions, duplicate ids, settings and timers", () => {
    const state = demoState(emptyState());
    for (const bad of [
      { ...state, schemaVersion: 2 },
      { ...state, tasks: null },
      { ...state, settings: { focusMinutes: 1.5 } },
      { ...state, tasks: [state.tasks[0], state.tasks[0]] },
      { ...state, tasks: [{ ...state.tasks[0], dueDate: "2026-02-30" }] },
      {
        ...state,
        tasks: [{ ...state.tasks[0], createdAt: "2026-02-30T12:00:00.000Z" }],
      },
      { ...state, tasks: [{ ...state.tasks[0], createdAt: "2026-01-01" }] },
      { ...state, timer: null },
      { ...state, timer: false },
      { ...state, timer: 0 },
      { ...state, timer: { remainingSeconds: 61, durationMinutes: 1 } },
      {
        ...state,
        timer: { remainingSeconds: 60, durationMinutes: 1, taskId: "missing" },
      },
    ])
      expect(() => parseState(bad)).toThrow();
  });
  it("rejects malformed sessions while allowing readable detached historical links", () => {
    const session = {
      id: "a",
      durationMinutes: 1,
      completedAt: "2026-10-12T10:00:00.000Z",
      taskId: "historical-deleted",
    };
    expect(
      parseState({ ...emptyState(), sessions: [session] }).sessions,
    ).toHaveLength(1);
    for (const sessions of [
      [session, session],
      [{ ...session, durationMinutes: 121 }],
      [{ ...session, completedAt: "2026-02-30T10:00:00.000Z" }],
    ])
      expect(() => parseState({ ...emptyState(), sessions })).toThrow();
  });
  it("seeds valid dated demo tasks only when empty", () => {
    const demo = demoState(emptyState());
    expect(parseState(demo).tasks).toHaveLength(3);
    expect(() => demoState(demo)).toThrow();
  });
});
describe("atomic replacement and export", () => {
  it("keeps data on invalid/cancel imports and replaces on confirmed import", async () => {
    const previous = demoState(emptyState());
    localStorage.setItem(STORAGE_KEY, backupJson(previous));
    render(<App />);
    upload("{broken");
    await screen.findByText(/Import failed:/);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).tasks).toHaveLength(
      3,
    );
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    upload(backupJson(emptyState()));
    await screen.findByText("Import cancelled. Your data is unchanged.");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).tasks).toHaveLength(
      3,
    );
    confirm.mockReturnValue(true);
    upload(backupJson(emptyState()));
    await screen.findByText("Backup restored. Your timer is paused.");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).tasks).toHaveLength(
      0,
    );
  });
  it("valid import recovers preserved corrupt storage and oversize files fail", async () => {
    localStorage.setItem(STORAGE_KEY, "broken");
    render(<App />);
    upload("{}", MAX_BACKUP_BYTES + 1);
    await screen.findByText(/Maximum file size is 1 MB/);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("broken");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    upload(backupJson(emptyState()));
    await screen.findByText("Backup restored. Your timer is paused.");
    expect(
      screen.queryByText(/Saved data could not be read/),
    ).not.toBeInTheDocument();
  });
  it("requests a real JSON download with current payload", () => {
    const create = vi.fn((_blob: Blob) => "blob:test");
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: create,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Export backup" }));
    expect(create.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(create.mock.calls[0][0].type).toBe("application/json");
    expect(click).toHaveBeenCalledOnce();
    expect(backupJson(emptyState())).toContain('"schemaVersion": 1');
  });
  it("storage failure leaves previous data after replacement confirmation", async () => {
    const previous = demoState(emptyState());
    localStorage.setItem(STORAGE_KEY, backupJson(previous));
    render(<App />);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw Error("quota");
    });
    upload(backupJson(emptyState()));
    await screen.findByText(
      "Backup was not restored because storage could not be updated.",
    );
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).tasks).toHaveLength(
      3,
    );
  });
  it("confirmed import stops active timer and restores imported snapshot paused", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Start focus" }));
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    upload(
      backupJson({
        ...emptyState(),
        settings: { focusMinutes: 1 },
        timer: { remainingSeconds: 30, durationMinutes: 1 },
      }),
    );
    await screen.findByText("Backup restored. Your timer is paused.");
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Pause" }),
    ).not.toBeInTheDocument();
  });
});
