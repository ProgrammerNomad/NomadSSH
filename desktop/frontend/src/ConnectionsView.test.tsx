import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import ConnectionsView from "./ConnectionsView";
import Explorer from "./Explorer";
import type { Profile } from "./api";
vi.mock("./api", () => ({
  date: (value: string) => value || "Never connected",
}));
afterEach(cleanup);
const host = (id: string, name: string, port: number): Profile => ({
  id,
  name,
  host: `${id}.example.test`,
  port,
  username: "deploy",
  auth: "password",
  keyId: "",
  group: "Development",
  tags: ["linux"],
  pinned: false,
  color: "cyan",
  lastConnected: "",
  jumpId: "",
});
const profiles = [host("b", "Build server", 2222), host("a", "Archive", 22)];
function props() {
  return {
    profiles,
    sessions: [],
    hosts: [],
    history: [],
    selected: "a",
    onSelect: vi.fn(),
    onConnect: vi.fn(),
    onEdit: vi.fn(),
    onNew: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onPin: vi.fn(),
    onNavigate: vi.fn(),
  };
}
describe("connection manager desktop workflows", () => {
  it("filters by hostname and sorts numeric ports", () => {
    render(<ConnectionsView {...props()} />);
    const table = screen.getByRole("table");
    fireEvent.click(within(table).getByRole("button", { name: "Port" }));
    expect(within(table).getAllByRole("row")[1].textContent).toContain(
      "Archive",
    );
    fireEvent.click(within(table).getByRole("button", { name: "Port" }));
    expect(within(table).getAllByRole("row")[1].textContent).toContain(
      "Build server",
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: "Filter connections" }),
      { target: { value: "b.example" } },
    );
    expect(within(table).getAllByRole("row")).toHaveLength(2);
    expect(within(table).getAllByRole("row")[1].textContent).toContain(
      "Build server",
    );
  });
  it("supports Enter to connect, F2 to edit and Delete with the caller confirmation", () => {
    const p = props();
    render(<ConnectionsView {...p} />);
    const row = screen.getByRole("row", { name: /Archive/ });
    fireEvent.keyDown(row, { key: "Enter" });
    expect(p.onConnect).toHaveBeenCalledWith("a");
    fireEvent.keyDown(row, { key: "F2" });
    expect(p.onEdit).toHaveBeenCalledWith(profiles[1]);
    fireEvent.keyDown(row, { key: "Delete" });
    expect(p.onDelete).toHaveBeenCalledWith(profiles[1]);
    fireEvent.keyDown(row, { key: "ArrowDown" });
    expect(p.onSelect).toHaveBeenCalledWith("b");
  });
  it("opens row context actions and closes them after choosing one", () => {
    const p = props();
    render(<ConnectionsView {...p} />);
    fireEvent.contextMenu(screen.getByRole("row", { name: /Build server/ }), {
      clientX: 300,
      clientY: 200,
    });
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate…" }));
    expect(p.onDuplicate).toHaveBeenCalledWith(profiles[0]);
    expect(screen.queryByRole("menu")).toBeNull();
  });
  it("keeps the host tree and connection callbacks independent", () => {
    const p = props();
    render(
      <Explorer
        profiles={profiles}
        sessions={[]}
        selected="a"
        onSelect={p.onSelect}
        onConnect={p.onConnect}
        onNew={p.onNew}
        onNavigate={p.onNavigate}
        onLock={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Build server" }));
    expect(p.onSelect).toHaveBeenCalledWith("b");
    expect(p.onConnect).not.toHaveBeenCalled();
    fireEvent.doubleClick(screen.getByRole("button", { name: "Build server" }));
    expect(p.onConnect).toHaveBeenCalledWith("b");
    fireEvent.change(screen.getByRole("textbox", { name: "Find saved host" }), {
      target: { value: "a.example" },
    });
    expect(screen.queryByRole("button", { name: "Build server" })).toBeNull();
  });
});
