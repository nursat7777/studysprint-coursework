import { useRef, useState } from "react";
import {
  emptyState,
  localToday,
  parseState,
  saveTask,
  type State,
} from "./model";
export const MAX_BACKUP_BYTES = 1024 * 1024;
export function backupJson(state: State): string {
  return JSON.stringify(parseState(state), null, 2);
}
export function demoState(state: State): State {
  if (state.tasks.length)
    throw Error("Demo data can only be added to an empty assignment list.");
  const now = new Date();
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );
  const nextWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 7,
  );
  let tasks = saveTask([], {
    title: "Finish the literature response",
    subject: "Literature",
    dueDate: localToday(yesterday),
    priority: "high",
    notes: "Write the final paragraph and check references.",
  });
  tasks = saveTask(tasks, {
    title: "Practice calculus problems",
    subject: "Mathematics",
    dueDate: localToday(),
    priority: "high",
    notes: "Focus on integration exercises for 25 minutes.",
  });
  tasks = saveTask(tasks, {
    title: "Prepare the biology presentation",
    subject: "Biology",
    dueDate: localToday(nextWeek),
    priority: "medium",
    notes: "Choose three clear examples and create slides.",
  });
  return { ...state, tasks };
}
export default function BackupPanel({
  state,
  onReplace,
  onDemo,
  blocked,
}: {
  state: State;
  onReplace: (next: State) => boolean;
  onDemo: (next: State) => boolean;
  blocked: boolean;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  function exportFile() {
    setError("");
    try {
      const blob = new Blob([backupJson(state)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `studysprint-${localToday()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setMessage("Backup download requested. Keep the file somewhere safe.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backup export failed.");
    }
  }
  async function importFile(file?: File) {
    setError("");
    setMessage("");
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES)
        throw Error("Backup is too large. Maximum file size is 1 MB.");
      const next = parseState(JSON.parse(await file.text()));
      if (
        !window.confirm(
          "Replace all assignments, focus sessions and settings with this backup? This cannot be undone.",
        )
      ) {
        setMessage("Import cancelled. Your data is unchanged.");
        return;
      }
      if (onReplace(next)) setMessage("Backup restored. Your timer is paused.");
      else
        setError(
          "Backup was not restored because storage could not be updated.",
        );
    } catch (e) {
      setError(
        `Import failed: ${e instanceof Error ? e.message : "Could not read file."}`,
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  return (
    <section className="panel backup-panel">
      <p className="eyebrow">KEEP YOUR WORK SAFE</p>
      <h2>Backups &amp; demo</h2>
      <p className="storage-note">
        Data stays in this browser. Export a JSON backup before clearing browser
        data. Imports replace everything after confirmation. Maximum upload: 1
        MB.
      </p>
      <div className="backup-actions">
        <button className="secondary" disabled={blocked} onClick={exportFile}>
          Export backup
        </button>
        <label className="upload-label" htmlFor="backup-file">
          Import backup
          <input
            ref={fileRef}
            id="backup-file"
            type="file"
            accept=".json,application/json"
            onChange={(e) => void importFile(e.target.files?.[0])}
          />
        </label>
      </div>
      {state.tasks.length === 0 && !blocked && (
        <button
          className="text-button"
          onClick={() => {
            if (onDemo(demoState(state)))
              setMessage(
                "Demo assignments added. Try searching or starting a focus session.",
              );
          }}
        >
          Try demo assignments
        </button>
      )}
      {blocked && (
        <>
          <p className="storage-note">
            Corrupt data is preserved. Restore a valid backup above, or
            explicitly discard it to start fresh.
          </p>
          <button
            className="text-button danger"
            onClick={() => {
              if (
                window.confirm(
                  "Permanently discard unreadable saved data and start fresh?",
                ) &&
                onReplace(emptyState())
              )
                setMessage("Storage reset. You can add assignments now.");
            }}
          >
            Discard unreadable data
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <p role="status" className="storage-note">
        {message}
      </p>
    </section>
  );
}
