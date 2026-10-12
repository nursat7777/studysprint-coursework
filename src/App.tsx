import { useState } from "react";
import {
  saveTask,
  validateTask,
  findTasks,
  summarize,
  localToday,
  type Filters,
  type TaskInput,
  type State,
} from "./model";
import { loadState, persistState } from "./storage";
import FocusTimer from "./FocusTimer";
import BackupPanel from "./BackupPanel";
const blank: TaskInput = {
  title: "",
  subject: "",
  dueDate: "",
  priority: "medium",
  notes: "",
};
export default function App() {
  const [initial] = useState(loadState);
  const [state, setState] = useState(initial.state);
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(initial.blocked);
  const [epoch, setEpoch] = useState(0);
  const [input, setInput] = useState<TaskInput>({ ...blank });
  const [editing, setEditing] = useState<string>();
  const [errors, setErrors] = useState<
    Partial<Record<keyof TaskInput, string>>
  >({});
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    priority: "all",
    sort: "dueDate",
  });
  const stats = summarize(state.tasks);
  const visible = findTasks(state.tasks, filters);
  const today = localToday();
  function update(next: State) {
    if (blocked) {
      setError(initial.error);
      return false;
    }
    try {
      persistState(next);
      setState(next);
      setError("");
      return true;
    } catch {
      setError(
        "Changes were not saved: browser storage is unavailable or full. Your previous saved assignments are unchanged.",
      );
      return false;
    }
  }
  function replace(next: State) {
    try {
      persistState(next);
      setState(next);
      setBlocked(false);
      setError("");
      setInput({ ...blank });
      setEditing(undefined);
      setErrors({});
      setEpoch((e) => e + 1);
      return true;
    } catch {
      setError(
        "Replacement was not saved: browser storage is unavailable or full. Previous saved data is unchanged.",
      );
      return false;
    }
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const validation = validateTask(input);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    if (update({ ...state, tasks: saveTask(state.tasks, input, editing) })) {
      setInput({ ...blank });
      setEditing(undefined);
    }
  }
  function field(name: keyof TaskInput, value: string) {
    setInput((i) => ({ ...i, [name]: value }));
  }
  return (
    <main className="workspace">
      <header className="hero">
        <div>
          <p className="eyebrow">YOUR STUDY WORKSPACE</p>
          <h1>StudySprint</h1>
          <p>A little structure. A lot more focus.</p>
        </div>
        <span className="local-badge">Saved on this device</span>
      </header>
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      <section className="stats" aria-label="Assignment overview">
        {[
          {
            label: "All assignments",
            value: stats.total,
            detail: "Everything on your plate",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            detail: "Time to catch up",
          },
          {
            label: "Due today",
            value: stats.dueToday,
            detail: "Today’s priorities",
          },
          {
            label: "Completed",
            value: stats.completed,
            detail: "Progress worth celebrating",
          },
        ].map((stat) => (
          <div className="stat" key={stat.label}>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <span>{stat.detail}</span>
          </div>
        ))}
      </section>
      <div className="layout">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR COURSEWORK</p>
              <h2>Assignments</h2>
            </div>
            <span>{visible.length} shown</span>
          </div>
          <div className="filters">
            <div className="search-field">
              <label htmlFor="search">Search assignments</label>
              <input
                id="search"
                type="search"
                placeholder="Title, subject or notes…"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value as Filters["status"],
                  })
                }
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority-filter">Priority filter</label>
              <select
                id="priority-filter"
                value={filters.priority}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priority: e.target.value as Filters["priority"],
                  })
                }
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort">Sort by</label>
              <select
                id="sort"
                value={filters.sort}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    sort: e.target.value as Filters["sort"],
                  })
                }
              >
                <option value="dueDate">Due date</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
          {state.tasks.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">✦</span>
              <h3>A fresh start</h3>
              <p>
                Add your first assignment and give your next study session a
                clear direction.
              </p>
              <button
                className="secondary"
                onClick={() => document.getElementById("title")?.focus()}
              >
                Create an assignment
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="empty">
              <h3>No matching assignments</h3>
              <p>
                Try another search or adjust your status and priority filters.
              </p>
              <button
                className="secondary"
                onClick={() =>
                  setFilters({
                    search: "",
                    status: "all",
                    priority: "all",
                    sort: "dueDate",
                  })
                }
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="task-list">
              {visible.map((task) => (
                <li
                  className={"task " + (task.completed ? "completed" : "")}
                  key={task.id}
                >
                  <div className="task-top">
                    <span className={"badge " + task.priority}>
                      {task.priority} priority
                    </span>
                    <span className="subject">{task.subject}</span>
                  </div>
                  <h3>{task.title}</h3>
                  <p className="due">
                    Due {task.dueDate} ·{" "}
                    {task.completed
                      ? "Completed"
                      : task.dueDate < today
                        ? "Overdue"
                        : task.dueDate === today
                          ? "Due today"
                          : "Active"}
                  </p>
                  {task.notes && <p className="notes">{task.notes}</p>}
                  <div className="task-actions">
                    <button
                      className="secondary"
                      onClick={() =>
                        update({
                          ...state,
                          tasks: state.tasks.map((t) =>
                            t.id === task.id
                              ? { ...t, completed: !t.completed }
                              : t,
                          ),
                        })
                      }
                    >
                      {task.completed ? "Reopen" : "Complete"}
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        setEditing(task.id);
                        setInput({
                          title: task.title,
                          subject: task.subject,
                          dueDate: task.dueDate,
                          priority: task.priority,
                          notes: task.notes,
                        });
                        setErrors({});
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-button danger"
                      onClick={() => {
                        if (window.confirm(`Delete “${task.title}”?`)) {
                          if (
                            update({
                              ...state,
                              tasks: state.tasks.filter(
                                (t) => t.id !== task.id,
                              ),
                              timer:
                                state.timer?.taskId === task.id
                                  ? { ...state.timer, taskId: undefined }
                                  : state.timer,
                              sessions: state.sessions.map((s) =>
                                s.taskId === task.id
                                  ? { ...s, taskId: undefined }
                                  : s,
                              ),
                            }) &&
                            editing === task.id
                          ) {
                            setEditing(undefined);
                            setInput({ ...blank });
                          }
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="side-panels">
          <section className="panel form-panel">
            <p className="eyebrow">MAKE A PLAN</p>
            <h2>{editing ? "Edit assignment" : "New assignment"}</h2>
            <form onSubmit={submit} noValidate>
              {(
                ["title", "subject", "dueDate", "priority", "notes"] as const
              ).map((name) => (
                <div className="field" key={name}>
                  <label htmlFor={name}>
                    {name === "dueDate"
                      ? "Due date"
                      : name === "notes"
                        ? "Notes (optional)"
                        : name.charAt(0).toUpperCase() + name.slice(1)}
                  </label>
                  {name === "priority" ? (
                    <select
                      id={name}
                      value={input[name]}
                      onChange={(e) => field(name, e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  ) : name === "notes" ? (
                    <textarea
                      id={name}
                      value={input[name]}
                      onChange={(e) => field(name, e.target.value)}
                      aria-invalid={!!errors[name]}
                      aria-describedby={
                        errors[name] ? `${name}-error` : undefined
                      }
                      rows={3}
                    />
                  ) : (
                    <input
                      id={name}
                      type={name === "dueDate" ? "date" : "text"}
                      value={input[name]}
                      onChange={(e) => field(name, e.target.value)}
                      aria-invalid={!!errors[name]}
                      aria-describedby={
                        errors[name] ? `${name}-error` : undefined
                      }
                      placeholder={
                        name === "title"
                          ? "e.g. Finish the history essay"
                          : name === "subject"
                            ? "e.g. History"
                            : undefined
                      }
                    />
                  )}{" "}
                  {errors[name] && (
                    <p id={`${name}-error`} className="field-error">
                      {errors[name]}
                    </p>
                  )}
                </div>
              ))}
              <button className="primary" type="submit">
                {editing ? "Save changes" : "Add assignment"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setEditing(undefined);
                    setInput({ ...blank });
                    setErrors({});
                  }}
                >
                  Cancel editing
                </button>
              )}
            </form>
            <p className="storage-note">
              Your assignments stay in this browser. No account needed.
            </p>
          </section>
          <FocusTimer key={epoch} state={state} onChange={update} />
          <BackupPanel
            state={state}
            onReplace={replace}
            onDemo={update}
            blocked={blocked}
          />
        </aside>
      </div>
    </main>
  );
}
