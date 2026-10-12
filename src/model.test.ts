import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  emptyState,
  parseState,
  saveTask,
  validateTask,
  validDate,
  localToday,
  summarize,
  findTasks,
  type TaskInput,
} from "./model";
import { loadState, persistState, STORAGE_KEY } from "./storage";
const input: TaskInput = {
  title: " Essay ",
  subject: " History ",
  dueDate: "2026-10-20",
  priority: "medium",
  notes: "",
};
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
describe("task validation", () => {
  it("trims saved title and subject, retains identity and completion on edit", () => {
    const [task] = saveTask([], input);
    expect(task.title).toBe("Essay");
    expect(task.subject).toBe("History");
    const [edited] = saveTask(
      [{ ...task, completed: true }],
      { ...input, title: "Revised" },
      task.id,
    );
    expect(edited).toMatchObject({
      id: task.id,
      createdAt: task.createdAt,
      completed: true,
      title: "Revised",
    });
  });
  it("validates blank and length boundaries", () => {
    expect(validateTask({ ...input, title: " ", subject: " " })).toHaveProperty(
      "title",
    );
    expect(
      validateTask({
        ...input,
        title: "a".repeat(120),
        subject: "b".repeat(80),
        notes: "c".repeat(2000),
      }),
    ).toEqual({});
    expect(
      validateTask({
        ...input,
        title: "a".repeat(121),
        subject: "b".repeat(81),
        notes: "c".repeat(2001),
      }),
    ).toMatchObject({
      title: expect.any(String),
      subject: expect.any(String),
      notes: expect.any(String),
    });
  });
  it("checks actual calendar dates including leap years and accepts past dates", () => {
    expect(validDate("2024-02-29")).toBe(true);
    for (const date of ["2025-02-29", "2026-04-31", "2026-13-01", "2026-1-01"])
      expect(validDate(date)).toBe(false);
    expect(validateTask({ ...input, dueDate: "2000-01-01" })).toEqual({});
  });
});
describe("safe persistence", () => {
  it("loads missing data and restores a valid state", () => {
    expect(loadState().state).toEqual(emptyState());
    const state = { ...emptyState(), tasks: saveTask([], input) };
    persistState(state);
    expect(loadState().state).toEqual(state);
  });
  it("reports and preserves malformed JSON and rejects duplicate ids", () => {
    localStorage.setItem(STORAGE_KEY, "broken");
    expect(loadState().blocked).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("broken");
    const tasks = saveTask([], input);
    expect(() =>
      parseState({ ...emptyState(), tasks: [...tasks, ...tasks] }),
    ).toThrow();
  });
  it("preserves previously saved records when quota write throws", () => {
    persistState(emptyState());
    const prior = localStorage.getItem(STORAGE_KEY);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw Error("quota");
    });
    expect(() =>
      persistState({ ...emptyState(), tasks: saveTask([], input) }),
    ).toThrow("quota");
    expect(localStorage.getItem(STORAGE_KEY)).toBe(prior);
  });
});

describe("finding and summarizing coursework", () => {
  it("uses local calendar fields", () => {
    expect(localToday(new Date(2026, 9, 12, 23, 59))).toBe("2026-10-12");
  });
  it("counts independently and excludes completed urgency", () => {
    const task = saveTask([], input)[0];
    expect(
      summarize(
        [
          { ...task, id: "1", dueDate: "2026-10-11" },
          { ...task, id: "2", dueDate: "2026-10-12" },
          { ...task, id: "3", dueDate: "2026-10-11", completed: true },
        ],
        "2026-10-12",
      ),
    ).toEqual({ total: 3, overdue: 1, dueToday: 1, completed: 1 });
  });
  it("combines search/status/priority and deterministically sorts without mutation", () => {
    const task = saveTask([], input)[0];
    const tasks = [
      { ...task, id: "b", priority: "low" as const },
      {
        ...task,
        id: "a",
        priority: "high" as const,
        notes: "Important REVIEW",
      },
      { ...task, id: "c", priority: "high" as const, completed: true },
    ];
    expect(
      findTasks(tasks, {
        search: "review",
        status: "active",
        priority: "high",
        sort: "priority",
      }).map((t) => t.id),
    ).toEqual(["a"]);
    expect(
      findTasks(tasks, {
        search: "",
        status: "all",
        priority: "all",
        sort: "priority",
      }).map((t) => t.id),
    ).toEqual(["a", "c", "b"]);
    expect(tasks.map((t) => t.id)).toEqual(["b", "a", "c"]);
  });
});
