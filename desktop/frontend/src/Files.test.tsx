import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import Files from "./Files";
import type { Listing, Session } from "./api";
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("./api", () => ({ api: invoke, bytes: (n: number) => `${n} B` }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const session = (id: string): Session => ({
  id,
  profileId: id,
  name: id,
  status: "connected",
  started: "",
  host: id,
  local: false,
  error: "",
  serverVersion: "SSH-2.0-test",
});
it("discards an old SFTP listing when the user changes sessions", async () => {
  let resolveOld!: (v: Listing) => void;
  invoke.mockImplementation(
    (_op: string, r: { remote?: boolean; id: string }) => {
      if (!r.remote)
        return Promise.resolve({ path: "/local", parent: "/", files: [] });
      if (r.id === "first")
        return new Promise<Listing>((resolve) => {
          resolveOld = resolve;
        });
      return Promise.resolve({ path: "/second-home", parent: "/", files: [] });
    },
  );
  render(
    <Files
      sessions={[session("first"), session("second")]}
      transfers={[]}
      error={vi.fn()}
    />,
  );
  fireEvent.change(
    screen.getByRole("combobox", { name: "SSH session for SFTP" }),
    { target: { value: "second" } },
  );
  await act(async () => {});
  expect(
    (screen.getByRole("textbox", { name: "Remote path" }) as HTMLInputElement)
      .value,
  ).toBe("/second-home");
  await act(async () =>
    resolveOld({ path: "/stale-first-home", parent: "/", files: [] }),
  );
  expect(
    (screen.getByRole("textbox", { name: "Remote path" }) as HTMLInputElement)
      .value,
  ).toBe("/second-home");
});
