import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import FocusTimer, { validDuration } from "./FocusTimer";
import { emptyState, type State } from "./model";
let saved: State;
function Harness({
  initial = emptyState(),
  fail = false,
}: {
  initial?: State;
  fail?: boolean;
}) {
  const [state, setState] = useState(initial);
  return (
    <FocusTimer
      state={state}
      onChange={(next) => {
        if (fail) return false;
        saved = next;
        setState(next);
        return true;
      }}
    />
  );
}
beforeEach(() => {
  vi.useFakeTimers();
  saved = emptyState();
});
afterEach(() => {
  vi.useRealTimers();
});
describe("focus timer", () => {
  it("validates duration boundaries", () => {
    for (const v of ["1", "25", "120"]) expect(validDuration(v)).toBe(true);
    for (const v of ["0", "-1", "1.5", "121", "abc", ""])
      expect(validDuration(v)).toBe(false);
  });
  it("starts pauses resumes resets and records exactly one completed session", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Focus duration (minutes)")).toHaveValue(25);
    fireEvent.change(screen.getByLabelText("Focus duration (minutes)"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start focus" }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("00:59")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("00:59")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    act(() => {
      vi.advanceTimersByTime(59000);
    });
    expect(saved.sessions).toHaveLength(1);
    expect(screen.getByText("00:00")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(saved.sessions).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("session was saved");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(saved.sessions).toHaveLength(1);
  });
  it("restores paused snapshot and cleans up interval on unmount", () => {
    const initial = {
      ...emptyState(),
      timer: { remainingSeconds: 12, durationMinutes: 1 },
      settings: { focusMinutes: 1 },
    };
    const view = render(<Harness initial={initial} />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("00:12")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(vi.getTimerCount()).toBe(1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("does not start if persistence fails and shows invalid input", () => {
    render(<Harness fail />);
    fireEvent.change(screen.getByLabelText("Focus duration (minutes)"), {
      target: { value: "121" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start focus" }));
    expect(
      screen.getByText("Choose a whole number from 1 to 120 minutes."),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Focus duration (minutes)"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start focus" }));
    expect(vi.getTimerCount()).toBe(0);
  });
});
