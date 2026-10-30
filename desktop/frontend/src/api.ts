import { Call } from "@wailsio/runtime";
export const api = async <T = unknown>(
  op: string,
  args: Record<string, unknown> = {},
): Promise<T> =>
  JSON.parse(
    await Call.ByName("main.App.Invoke", JSON.stringify({ op, ...args })),
  );
export const poll = async (): Promise<AppEvent[]> =>
  JSON.parse(await Call.ByName("main.App.Poll"));
export const chooseFile = (): Promise<string> =>
  Call.ByName("main.App.ChooseFile");
export const saveFile = (): Promise<string> => Call.ByName("main.App.SaveFile");
export interface Profile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  auth: string;
  keyId: string;
  group: string;
  tags: string[];
  pinned: boolean;
  color: string;
  lastConnected: string;
  jumpId: string;
  password?: string;
}
export interface Key {
  id: string;
  name: string;
  type: string;
  fingerprint: string;
  publicKey: string;
  group: string;
  created: string;
}
export interface Session {
  id: string;
  profileId: string;
  name: string;
  status: string;
  started: string;
  host: string;
  local: boolean;
  error: string;
  serverVersion: string;
}
export interface Snippet {
  id: string;
  name: string;
  command: string;
  category: string;
}
export interface Tunnel {
  id: string;
  name: string;
  profileId: string;
  type: string;
  bind: string;
  destination: string;
}
export interface Settings {
  fontSize: number;
  scrollback: number;
  idleMinutes: number;
  theme: string;
}
export interface Host {
  host: string;
  fingerprint: string;
  type: string;
  added: string;
}
export interface History {
  id: string;
  name: string;
  kind: string;
  time: string;
  status: string;
  detail: string;
}
export interface Transfer {
  id: string;
  sessionId: string;
  name: string;
  source: string;
  destination: string;
  direction: string;
  status: string;
  bytes: number;
  total: number;
  speed: number;
  error: string;
}
export interface State {
  demo?: boolean;
  locked: boolean;
  exists: boolean;
  version: string;
  home: string;
  dataPath: string;
  data?: {
    profiles: Profile[];
    keys: Key[];
    hosts: Host[];
    snippets: Snippet[];
    tunnels: Tunnel[];
    history: History[];
    settings: Settings;
  };
  sessions?: Session[];
  runningTunnels?: string[];
  transfers?: Transfer[];
}
export interface AppEvent {
  kind: string;
  id: string;
  data: any;
}
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  directory: boolean;
  symlink: boolean;
  modified: string;
  permissions: string;
}
export interface Listing {
  path: string;
  parent: string;
  files: FileInfo[];
}
export function bytes(n: number) {
  if (n < 1024) return `${n} B`;
  const units = ["KiB", "MiB", "GiB", "TiB"];
  let i = -1;
  do {
    n /= 1024;
    i++;
  } while (n >= 1024 && i < 3);
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}
export function date(value: string) {
  return value ? new Date(value).toLocaleString() : "Never connected";
}
