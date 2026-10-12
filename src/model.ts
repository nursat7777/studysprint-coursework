export type Priority = "low" | "medium" | "high";
export interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: Priority;
  notes: string;
  completed: boolean;
  createdAt: string;
}
export interface Session {
  id: string;
  taskId?: string;
  durationMinutes: number;
  completedAt: string;
}
export interface TimerSnapshot {
  remainingSeconds: number;
  durationMinutes: number;
  taskId?: string;
}
export interface State {
  schemaVersion: 1;
  tasks: Task[];
  sessions: Session[];
  settings: { focusMinutes: number };
  timer?: TimerSnapshot;
}
export type TaskInput = Pick<
  Task,
  "title" | "subject" | "dueDate" | "priority" | "notes"
>;
export const emptyState = (): State => ({
  schemaVersion: 1,
  tasks: [],
  sessions: [],
  settings: { focusMinutes: 25 },
});
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(y, m - 1, d);
  return (
    y >= 1 &&
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}
export function validateTask(
  input: TaskInput,
): Partial<Record<keyof TaskInput, string>> {
  const errors: Partial<Record<keyof TaskInput, string>> = {};
  if (!input.title.trim() || input.title.trim().length > 120)
    errors.title = "Enter a title with 1–120 characters.";
  if (!input.subject.trim() || input.subject.trim().length > 80)
    errors.subject = "Enter a subject with 1–80 characters.";
  if (!validDate(input.dueDate))
    errors.dueDate = "Choose a real calendar date.";
  if (!["low", "medium", "high"].includes(input.priority))
    errors.priority = "Choose low, medium or high.";
  if (input.notes.length > 2000)
    errors.notes = "Notes must be 2000 characters or fewer.";
  return errors;
}
export function saveTask(tasks: Task[], input: TaskInput, id?: string): Task[] {
  if (Object.keys(validateTask(input)).length)
    throw Error("Invalid assignment");
  const existing = tasks.find((t) => t.id === id);
  const task: Task = {
    ...input,
    title: input.title.trim(),
    subject: input.subject.trim(),
    id: existing?.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    completed: existing?.completed ?? false,
  };
  return existing
    ? tasks.map((t) => (t.id === id ? task : t))
    : [...tasks, task];
}
export function validTimestamp(value: unknown): boolean {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    validDate(value.slice(0, 10)) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
export function parseState(value: unknown): State {
  if (!value || typeof value !== "object")
    throw Error("Backup must be an object.");
  const s = value as State;
  if (
    s.schemaVersion !== 1 ||
    !Array.isArray(s.tasks) ||
    !Array.isArray(s.sessions) ||
    !s.settings ||
    !Number.isInteger(s.settings.focusMinutes) ||
    s.settings.focusMinutes < 1 ||
    s.settings.focusMinutes > 120
  )
    throw Error("Unsupported or malformed saved data.");
  const ids = new Set<string>();
  for (const t of s.tasks) {
    if (
      !t ||
      typeof t.id !== "string" ||
      !t.id ||
      ids.has(t.id) ||
      typeof t.title !== "string" ||
      typeof t.subject !== "string" ||
      typeof t.dueDate !== "string" ||
      typeof t.notes !== "string" ||
      typeof t.completed !== "boolean" ||
      !validTimestamp(t.createdAt) ||
      Object.keys(validateTask(t)).length
    )
      throw Error("Invalid assignment in saved data.");
    ids.add(t.id);
  }
  const sessionIds = new Set<string>();
  for (const x of s.sessions) {
    if (
      !x ||
      typeof x.id !== "string" ||
      !x.id ||
      sessionIds.has(x.id) ||
      !Number.isInteger(x.durationMinutes) ||
      x.durationMinutes < 1 ||
      x.durationMinutes > 120 ||
      !validTimestamp(x.completedAt) ||
      (x.taskId !== undefined && typeof x.taskId !== "string")
    )
      throw Error("Invalid focus session.");
    sessionIds.add(x.id);
  }
  if (
    s.timer !== undefined &&
    (!s.timer ||
      typeof s.timer !== "object" ||
      !Number.isInteger(s.timer.durationMinutes) ||
      s.timer.durationMinutes < 1 ||
      s.timer.durationMinutes > 120 ||
      !Number.isInteger(s.timer.remainingSeconds) ||
      s.timer.remainingSeconds < 0 ||
      s.timer.remainingSeconds > s.timer.durationMinutes * 60 ||
      (s.timer.taskId !== undefined &&
        (typeof s.timer.taskId !== "string" || !ids.has(s.timer.taskId))))
  )
    throw Error("Invalid timer state.");
  return {
    ...s,
    tasks: s.tasks.map((t) => ({
      ...t,
      title: t.title.trim(),
      subject: t.subject.trim(),
    })),
  };
}
export function localToday(date = new Date()): string {
  return `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}
export function summarize(tasks: Task[], today = localToday()) {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    overdue: tasks.filter((t) => !t.completed && t.dueDate < today).length,
    dueToday: tasks.filter((t) => !t.completed && t.dueDate === today).length,
  };
}
export interface Filters {
  search: string;
  status: "all" | "active" | "completed";
  priority: "all" | Priority;
  sort: "dueDate" | "priority";
}
export function findTasks(tasks: Task[], filters: Filters): Task[] {
  const query = filters.search.trim().toLowerCase();
  const rank = { high: 0, medium: 1, low: 2 };
  return tasks
    .filter(
      (t) =>
        (filters.status === "all" ||
          t.completed === (filters.status === "completed")) &&
        (filters.priority === "all" || t.priority === filters.priority) &&
        `${t.title} ${t.subject} ${t.notes}`.toLowerCase().includes(query),
    )
    .sort(
      (a, b) =>
        (filters.sort === "priority"
          ? rank[a.priority] - rank[b.priority]
          : a.dueDate.localeCompare(b.dueDate)) ||
        a.dueDate.localeCompare(b.dueDate) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    );
}
