import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ProfileForm } from "./ConnectionForms";
import type { Profile } from "./api";
vi.mock("./api", () => ({ chooseFile: vi.fn() }));
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
});
afterEach(cleanup);
const profile: Profile = {
  id: "existing",
  name: "Build server",
  host: "build.example.test",
  port: 22,
  username: "deploy",
  auth: "password",
  keyId: "",
  group: "Development",
  tags: [],
  pinned: false,
  color: "blue",
  lastConnected: "",
  jumpId: "",
};
it("distinguishes saving a profile from saving and connecting without exposing stored passwords", () => {
  const save = vi.fn();
  render(
    <ProfileForm
      initial={profile}
      keys={[]}
      profiles={[profile]}
      onSave={save}
      onClose={vi.fn()}
      busy={false}
    />,
  );
  expect(
    (screen.getByLabelText(/Password.*Leave blank/) as HTMLInputElement).value,
  ).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "Save connection" }));
  expect(save).toHaveBeenLastCalledWith(profile, false);
  fireEvent.click(screen.getByRole("button", { name: "Save & connect" }));
  expect(save).toHaveBeenLastCalledWith(profile, true);
});
