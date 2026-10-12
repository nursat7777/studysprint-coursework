import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { STORAGE_KEY } from "./storage";
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
function fill(title = "Essay") {
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: title },
  });
  fireEvent.change(screen.getByLabelText("Subject"), {
    target: { value: "History" },
  });
  fireEvent.change(screen.getByLabelText("Due date"), {
    target: { value: "2026-10-20" },
  });
}
describe("application", () => {
  it("provides the named student workspace", () => {
    render(<App />);
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { level: 1, name: "StudySprint" }),
    );
  });
  it("creates, edits, completes, reopens, persists and confirms deletion", () => {
    const view = render(<App />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Add assignment" }));
    expect(screen.getByRole("heading", { name: "Essay" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Revised essay" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    expect(screen.getByRole("button", { name: "Reopen" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reopen" }));
    view.unmount();
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Revised essay" }),
    ).toBeInTheDocument();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(
      screen.getByRole("heading", { name: "Revised essay" }),
    ).toBeInTheDocument();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(
      screen.queryByRole("heading", { name: "Revised essay" }),
    ).not.toBeInTheDocument();
  });
  it("shows validation and protects existing storage on write failure", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Add assignment" }));
    expect(
      screen.getByText("Enter a title with 1–120 characters."),
    ).toBeInTheDocument();
    fill();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw Error("quota");
    });
    fireEvent.click(screen.getByRole("button", { name: "Add assignment" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Changes were not saved",
    );
    expect(
      screen.queryByRole("heading", { name: "Essay" }),
    ).not.toBeInTheDocument();
  });
  it("preserves corrupt storage and reports it", () => {
    localStorage.setItem(STORAGE_KEY, "broken");
    render(<App />);
    expect(screen.getByRole("alert")).toHaveTextContent("preserved");
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Add assignment" }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("broken");
  });
});

it("keeps totals while combining labeled filters and exposes native clear/create controls", () => {
  render(<App />);
  fill("Biology review");
  fireEvent.click(screen.getByRole("button", { name: "Add assignment" }));
  expect(screen.getByLabelText("Search assignments")).toBeInTheDocument();
  expect(screen.getByLabelText("Status")).toBeInTheDocument();
  expect(screen.getByLabelText("Priority filter")).toBeInTheDocument();
  expect(screen.getByLabelText("Sort by")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search assignments"), {
    target: { value: "nothing" },
  });
  expect(screen.getByText("No matching assignments")).toBeInTheDocument();
  expect(screen.getByLabelText("Assignment overview")).toHaveTextContent(
    "All assignments1",
  );
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(
    screen.getByRole("heading", { name: "Biology review" }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Status"), {
    target: { value: "completed" },
  });
  expect(screen.getByText("No matching assignments")).toBeInTheDocument();
});

it("persists linked timer paused after remount and detaches a deleted assignment", () => {
  const view = render(<App />);
  fill("Focus essay");
  fireEvent.click(screen.getByRole("button", { name: "Add assignment" }));
  const state = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  fireEvent.change(screen.getByLabelText("Focus assignment"), {
    target: { value: state.tasks[0].id },
  });
  fireEvent.change(screen.getByLabelText("Focus duration (minutes)"), {
    target: { value: "1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Start focus" }));
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  view.unmount();
  render(<App />);
  expect(screen.getByLabelText("Focus duration (minutes)")).toHaveValue(1);
  expect(
    screen.getByRole("button", { name: "Start focus" }),
  ).toBeInTheDocument();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  expect(screen.getByLabelText("Focus assignment")).toHaveValue("");
  expect(
    JSON.parse(localStorage.getItem(STORAGE_KEY)!).timer.taskId,
  ).toBeUndefined();
});
