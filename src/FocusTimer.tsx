import { useEffect, useRef, useState } from "react";
import type { State, TimerSnapshot } from "./model";
export function validDuration(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 120;
}
export default function FocusTimer({
  state,
  onChange,
}: {
  state: State;
  onChange: (state: State) => boolean;
}) {
  const [duration, setDuration] = useState(String(state.settings.focusMinutes));
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const latest = useRef({ state, onChange });
  latest.current = { state, onChange };
  const completed = useRef(false);
  function commit(next: State) {
    const saved = latest.current.onChange(next);
    if (saved) latest.current.state = next;
    return saved;
  }
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      const current = latest.current.state;
      const timer = current.timer;
      if (!timer) {
        setRunning(false);
        return;
      }
      const remaining = Math.max(0, timer.remainingSeconds - 1);
      const nextTimer = { ...timer, remainingSeconds: remaining };
      if (remaining === 0) {
        setRunning(false);
        if (!completed.current) {
          completed.current = true;
          const session = {
            id: crypto.randomUUID(),
            taskId: timer.taskId,
            durationMinutes: timer.durationMinutes,
            completedAt: new Date().toISOString(),
          };
          if (
            commit({
              ...current,
              timer: nextTimer,
              sessions: [...current.sessions, session],
            })
          )
            setAnnouncement(
              "Focus session complete. Great work — your session was saved.",
            );
          else
            setAnnouncement(
              "Session ended, but it could not be saved. Check the storage warning.",
            );
        }
      } else if (!commit({ ...current, timer: nextTimer })) {
        setRunning(false);
        setAnnouncement(
          "Timer paused because its progress could not be saved.",
        );
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);
  function configured(): TimerSnapshot | undefined {
    if (!validDuration(duration)) {
      setError("Choose a whole number from 1 to 120 minutes.");
      return;
    }
    setError("");
    return {
      durationMinutes: Number(duration),
      remainingSeconds: Number(duration) * 60,
      taskId: state.timer?.taskId,
    };
  }
  function start() {
    const fresh = configured();
    if (!fresh) return;
    const timer =
      state.timer &&
      state.timer.durationMinutes === fresh.durationMinutes &&
      state.timer.remainingSeconds > 0
        ? state.timer
        : fresh;
    if (
      commit({
        ...state,
        settings: { focusMinutes: fresh.durationMinutes },
        timer,
      })
    ) {
      completed.current = false;
      setAnnouncement("");
      setRunning(true);
    }
  }
  function reset() {
    const timer = configured();
    if (!timer) return;
    setRunning(false);
    if (
      commit({
        ...state,
        settings: { focusMinutes: timer.durationMinutes },
        timer,
      })
    ) {
      completed.current = false;
      setAnnouncement("Timer reset.");
    }
  }
  const seconds =
    state.timer?.remainingSeconds ?? state.settings.focusMinutes * 60;
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <section className="panel focus-panel" aria-labelledby="focus-heading">
      <p className="eyebrow">ONE THING AT A TIME</p>
      <h2 id="focus-heading">Focus session</h2>
      <p className="focus-copy">Settle in. Small, focused steps add up.</p>
      <div
        className="clock"
        aria-label={`${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds remaining`}
      >
        {clock}
      </div>
      <p className="timer-status">
        {running
          ? "Focus in progress"
          : state.timer &&
              seconds < state.timer.durationMinutes * 60 &&
              seconds > 0
            ? "Paused — ready when you are"
            : "Ready to focus"}
      </p>
      <div className="field">
        <label htmlFor="focus-duration">Focus duration (minutes)</label>
        <input
          id="focus-duration"
          type="number"
          min="1"
          max="120"
          step="1"
          value={duration}
          disabled={running}
          onChange={(e) => setDuration(e.target.value)}
          aria-describedby={error ? "duration-error" : undefined}
          aria-invalid={!!error}
        />
        {error && (
          <p className="field-error" id="duration-error">
            {error}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="focus-task">Focus assignment</label>
        <select
          id="focus-task"
          value={state.timer?.taskId ?? ""}
          disabled={running}
          onChange={(e) => {
            const timer = state.timer ?? {
              remainingSeconds: state.settings.focusMinutes * 60,
              durationMinutes: state.settings.focusMinutes,
            };
            commit({
              ...state,
              timer: { ...timer, taskId: e.target.value || undefined },
            });
          }}
        >
          <option value="">Unlinked focus session</option>
          {state.tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>
      <div className="timer-actions">
        {running ? (
          <button
            className="primary"
            onClick={() => {
              setRunning(false);
              setAnnouncement("Timer paused.");
            }}
          >
            Pause
          </button>
        ) : (
          <button className="primary" onClick={start}>
            {state.timer &&
            seconds > 0 &&
            seconds < state.timer.durationMinutes * 60
              ? "Resume"
              : "Start focus"}
          </button>
        )}
        <button className="secondary" onClick={reset}>
          Reset
        </button>
      </div>
      <p role="status" className="session-announcement">
        {announcement}
      </p>
      <p className="storage-note">
        Refresh restores your timer paused. Keep this tab open while focusing;
        background tabs may slow the countdown.
      </p>
      <div className="session-history">
        <h3>
          Finished sessions <span>{state.sessions.length}</span>
        </h3>
        {state.sessions.length === 0 ? (
          <p className="storage-note">
            Your first completed session will appear here.
          </p>
        ) : (
          <ul>
            {state.sessions
              .slice()
              .reverse()
              .slice(0, 5)
              .map((session) => (
                <li key={session.id}>
                  <strong>{session.durationMinutes} min</strong>
                  <span>
                    {state.tasks.find((t) => t.id === session.taskId)?.title ??
                      "Unlinked session"}
                  </span>
                  <time dateTime={session.completedAt}>
                    {new Date(session.completedAt).toLocaleString()}
                  </time>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}
