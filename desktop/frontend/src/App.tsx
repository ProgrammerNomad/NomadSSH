import { useEffect, useRef, useState } from "react";
import { Call, Events } from "@wailsio/runtime";
import Explorer from "./Explorer";
import { ProfileForm, KeyForm } from "./ConnectionForms";
import ConnectionsView from "./ConnectionsView";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Copy,
  Folder,
  FolderSync,
  HardDrive,
  KeyRound,
  Link2,
  LockKeyhole,
  Network,
  Pencil,
  PanelLeft,
  Plus,
  Search,
  Server,
  Settings2,
  Shield,
  ShieldCheck,
  SplitSquareHorizontal,
  TerminalSquare,
  Trash2,
  X,
} from "lucide-react";
import {
  api,
  poll,
  chooseFile,
  saveFile,
  Profile,
  Session,
  State,
  Snippet,
  Tunnel,
  Settings,
  AppEvent,
  date,
} from "./api";
import TerminalPane, {
  output,
  terminals,
  clearTerminalState,
} from "./TerminalPane";
import Files from "./Files";
import DrivePanel from "./DrivePanel";
import { Empty, Field, Modal } from "./ui";

const navigation = [
  { id: "connections", label: "Connections", icon: Server },
  { id: "terminal", label: "Terminal", icon: TerminalSquare },
  { id: "files", label: "File transfer", icon: Folder },
  { id: "tunnels", label: "Port forwarding", icon: Network },
  { id: "snippets", label: "Snippets", icon: BookOpen },
];
const defaults: Profile = {
  id: "",
  name: "",
  host: "",
  port: 22,
  username: "",
  auth: "password",
  keyId: "",
  group: "Personal",
  tags: [],
  pinned: false,
  color: "cyan",
  lastConnected: "",
  jumpId: "",
};
const blankSettings: Settings = {
  fontSize: 14,
  scrollback: 10000,
  idleMinutes: 15,
  theme: "dark",
};
export default function App() {
  const [explorerVisible, setExplorerVisible] = useState(true);
  const [about, setAbout] = useState(false);
  const [closeAll, setCloseAll] = useState(false);
  const [quitRequested, setQuitRequested] = useState(false);
  const commandRef = useRef<(command: string) => void>();
  useEffect(
    () => Events.On("app:command", (e) => commandRef.current?.(String(e.data))),
    [],
  );
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restorePath, setRestorePath] = useState("");
  const [state, setState] = useState<State>();
  const [page, setPage] = useState("connections");

  const [selected, setSelected] = useState<string>();
  const [active, setActive] = useState("");
  const [split, setSplit] = useState(false);
  const [profile, setProfile] = useState<Profile>();
  const [keyForm, setKeyForm] = useState(false);
  const [snippet, setSnippet] = useState<Snippet>();
  const [tunnel, setTunnel] = useState<Tunnel>();
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    op: string;
    id: string;
  }>();
  const [toast, setToast] = useState("");
  const [prompts, setPrompts] = useState<AppEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<Settings>(blankSettings);
  const [palette, setPalette] = useState(false);
  const stateRef = useRef<State>();
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const refreshRef = useRef<() => Promise<void>>();
  const error = (e: unknown) => {
    setToast(e instanceof Error ? e.message : String(e));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6500);
  };
  const refresh = async () => {
    try {
      const s = await api<State>("state");
      stateRef.current = s;
      setState(s);
    } catch (e) {
      error(e);
    }
  };
  refreshRef.current = refresh;
  useEffect(() => {
    void refresh();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;
    const pump = async () => {
      try {
        for (const event of await poll()) {
          if (event.kind === "output" && !stateRef.current?.locked)
            output(event.id, event.data);
          if (event.kind === "driveConnected") error("Google Drive connected");
          if (event.kind === "syncError") error(event.data);
          if (event.kind === "hostKey") setPrompts((p) => [...p, event]);
          if (event.kind === "hostKeyDone")
            setPrompts((p) => p.filter((v) => v.id !== event.id));
          if (event.kind === "session" && event.data.status === "error")
            error(event.data.error);
          if (event.kind === "locked") {
            clearTerminalState();
            setPrompts([]);
            setActive("");
            setProfile(undefined);
            setKeyForm(false);
            setPage("connections");
            await refreshRef.current?.();
          }
        }
        if (++count % 12 === 0) await refreshRef.current?.();
      } catch (e) {
        if (count === 0) error(e);
      }
      if (!stopped) timer = setTimeout(pump, 80);
    };
    void pump();
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    let last = 0;
    const activity = () => {
      if (!stateRef.current?.locked && Date.now() - last > 30000) {
        last = Date.now();
        void api("activity").catch(() => {});
      }
    };
    window.addEventListener("keydown", activity);
    window.addEventListener("pointerdown", activity);
    const keys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "l"
      ) {
        e.preventDefault();
        void perform("lock");
      }
    };
    window.addEventListener("keydown", keys);
    return () => {
      window.removeEventListener("keydown", activity);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", keys);
    };
  }, []);
  useEffect(() => {
    if (state?.data?.settings) setSettings(state.data.settings);
  }, [
    state?.data?.settings.fontSize,
    state?.data?.settings.idleMinutes,
    state?.data?.settings.scrollback,
  ]);
  const perform = async <T = unknown,>(
    op: string,
    args: Record<string, unknown> = {},
  ): Promise<T | undefined> => {
    try {
      const result = await api<T>(op, args);
      await refresh();
      return result;
    } catch (e) {
      error(e);
      return undefined;
    }
  };
  const connect = async (id: string) => {
    const session = await perform<Session>("connect", { id });
    if (session) {
      setActive(session.id);
      setPage("terminal");
    }
  };
  const local = async () => {
    const session = await perform<Session>("local");
    if (session) {
      setActive(session.id);
      setPage("terminal");
    }
  };
  const closeSession = async (id: string) => {
    await perform("disconnect", { id });
    if (active === id)
      setActive((state?.sessions || []).find((s) => s.id !== id)?.id || "");
  };
  const profiles = state?.data?.profiles || [],
    sessions = state?.sessions || [],
    keys = state?.data?.keys || [],
    snippets = state?.data?.snippets || [],
    tunnels = state?.data?.tunnels || [];
  const connected = sessions.filter((s) => s.status === "connected");
  const details = profiles.find((p) => p.id === selected) || profiles[0];
  const activeSession = sessions.find((s) => s.id === active);
  const currentTitle =
    navigation.find((v) => v.id === page)?.label ||
    (
      {
        keys: "Key manager",
        activity: "Connection log",
        settings: "Preferences",
        sync: "Backup & sync",
      } as Record<string, string>
    )[page];
  const deleteProfile = (p: Profile) =>
    setConfirm({
      title: "Delete connection?",
      description: `Remove ${p.name} from saved connections? Active sessions will remain open.`,
      op: "deleteProfile",
      id: p.id,
    });
  commandRef.current = (command: string) => {
    if (command === "about") {
      setAbout(true);
      return;
    }
    if (command === "quit") {
      setQuitRequested(true);
      return;
    }
    if (stateRef.current?.locked) {
      error("Unlock the workspace to use this command.");
      return;
    }
    if (document.querySelector("dialog[open]")) return;
    if (command === "new") setProfile({ ...defaults });
    else if (command === "local") void local();
    else if (command === "connect" && details) void connect(details.id);
    else if (command === "disconnect" && active) void closeSession(active);
    else if (command === "closeAll") setCloseAll(true);
    else if (command === "lock") void perform("lock");
    else if (command === "commands") setPalette(true);
    else if (command === "explorer") setExplorerVisible((v) => !v);
    else if (command === "split") {
      setSplit((v) => !v);
      setPage("terminal");
    } else if (
      [
        "connections",
        "terminal",
        "files",
        "tunnels",
        "snippets",
        "keys",
        "sync",
        "activity",
        "settings",
      ].includes(command)
    )
      setPage(command);
  };
  const auth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    if (!state?.exists && password !== fd.get("confirm")) {
      error("Passwords do not match");
      return;
    }
    setBusy(true);
    await perform(state?.exists ? "unlock" : "createVault", { password });
    setBusy(false);
  };
  if (!state || state.locked)
    return (
      <div className="onboarding">
        <div className="onboard-brand">
          <Logo />
          <span className="build-tag">SSH CLIENT</span>
        </div>
        <section className="unlock-card">
          <div className="lock-hero">
            <LockKeyhole size={26} />
          </div>
          <h2>{state?.exists ? "Unlock workspace" : "Create workspace"}</h2>
          <p>
            {state?.exists
              ? "Enter your master password to open saved connections."
              : "Choose a master password to encrypt your connection data."}
          </p>
          <form onSubmit={auth}>
            <Field label="Master password">
              <input
                name="password"
                type="password"
                minLength={state?.exists ? 1 : 12}
                required
                autoFocus
                autoComplete={
                  state?.exists ? "current-password" : "new-password"
                }
                placeholder={
                  state?.exists
                    ? "Enter your master password"
                    : "At least 12 characters"
                }
              />
            </Field>
            {!state?.exists && (
              <Field label="Confirm master password">
                <input
                  name="confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Enter it again"
                />
              </Field>
            )}
            <button className="primary full-button" disabled={busy || !state}>
              {busy
                ? "Opening workspace…"
                : state?.exists
                  ? "Unlock workspace"
                  : "Create workspace"}
              <ArrowRight size={16} />
            </button>
          </form>
          <div className="security-note">
            <ShieldCheck size={16} />
            <span>
              AES-256-GCM encryption · Argon2id
              <br />
              Private keys are stored in the OS keychain.
            </span>
          </div>
          {toast && <div className="error">{toast}</div>}
          <small className="muted">
            {state?.exists
              ? "Your master password is required to unlock this vault."
              : "Keep your master password safe. It cannot be recovered."}
          </small>
        </section>
        {about && (
          <Modal title="About NomadSSH" onClose={() => setAbout(false)}>
            <div className="about-dialog">
              <Logo />
              <p>Desktop SSH client built in Go.</p>
              <p>Version {state?.version || "0.2.0-dev"} · Wails interface</p>
            </div>
            <footer>
              <button onClick={() => setAbout(false)}>Close</button>
            </footer>
          </Modal>
        )}
        <div className="onboard-footer">
          NomadSSH <span>{state?.version}</span>
        </div>
      </div>
    );
  return (
    <div className="app">
      {explorerVisible && (
        <Explorer
          profiles={profiles}
          sessions={sessions}
          selected={details?.id}
          demo={state.demo}
          onSelect={(id) => {
            setSelected(id);
            setPage("connections");
          }}
          onConnect={(id) => void connect(id)}
          onNew={() => setProfile({ ...defaults })}
          onNavigate={setPage}
          onLock={() => void perform("lock")}
        />
      )}
      <div className="main-shell">
        <header className="desktop-toolbar" aria-label="Application toolbar">
          <button
            className="icon"
            aria-label="Toggle connection manager"
            aria-pressed={explorerVisible}
            title="Toggle connection manager"
            onClick={() => setExplorerVisible((v) => !v)}
          >
            <PanelLeft size={16} />
          </button>
          <button
            title="New connection (Ctrl+N)"
            onClick={() => setProfile({ ...defaults })}
          >
            <Plus size={15} />
            New
          </button>
          <button
            className="primary"
            disabled={!details}
            onClick={() => details && void connect(details.id)}
          >
            <ArrowRight size={15} />
            Connect
          </button>
          <button
            disabled={!activeSession}
            onClick={() => void closeSession(active)}
          >
            <X size={14} />
            Disconnect
          </button>
          <span className="toolbar-separator" />
          <button onClick={() => void local()}>
            <TerminalSquare size={15} />
            Local terminal
          </button>
          <button onClick={() => setPage("files")}>
            <Folder size={15} />
            SFTP
          </button>
          <span className="grow" />
          {state.demo && <span className="demo-label">LOCAL DEMO</span>}
          <button
            className="icon"
            title="Command palette (Ctrl+K)"
            onClick={() => setPalette(true)}
          >
            <Search size={15} />
          </button>
          <button
            className="icon"
            title="Preferences"
            onClick={() => setPage("settings")}
          >
            <Settings2 size={15} />
          </button>
        </header>
        <nav className="view-tabs" aria-label="Workspace views">
          {navigation.map((n) => (
            <button
              aria-current={page === n.id ? "page" : undefined}
              className={page === n.id ? "active" : ""}
              key={n.id}
              onClick={() => {
                setPage(n.id);
                if (n.id === "terminal" && !active)
                  setActive(sessions[0]?.id || "");
              }}
            >
              <n.icon size={14} />
              {n.label}
            </button>
          ))}
          {!navigation.some((n) => n.id === page) && (
            <span className="active auxiliary-tab">{currentTitle}</span>
          )}
        </nav>
        {sessions.length > 0 && (
          <div className="session-tabs">
            {sessions.map((s) => (
              <div
                className={`session-tab ${page === "terminal" && s.id === active ? "active" : ""}`}
                key={s.id}
              >
                <button
                  className="session-select"
                  onClick={() => {
                    setActive(s.id);
                    setPage("terminal");
                  }}
                >
                  <i className={`dot ${s.status}`} />
                  <span>{s.name}</span>
                </button>
                <button
                  className="tab-close"
                  aria-label={`Close ${s.name}`}
                  onClick={() => void closeSession(s.id)}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              title="New local terminal"
              aria-label="New local terminal"
              className="tab-add"
              onClick={() => void local()}
            >
              <Plus size={16} />
            </button>
          </div>
        )}
        <main
          className={
            page === "terminal"
              ? "terminal-main"
              : page === "connections"
                ? "manager-main"
                : "content"
          }
        >
          {page === "connections" && (
            <ConnectionsView
              profiles={profiles}
              sessions={sessions}
              hosts={state.data?.hosts || []}
              history={state.data?.history || []}
              selected={details?.id}
              onSelect={setSelected}
              onConnect={(id) => void connect(id)}
              onEdit={(p) => setProfile({ ...p })}
              onNew={() => setProfile({ ...defaults })}
              onDuplicate={(p) =>
                setProfile({ ...p, id: "", name: p.name + " copy" })
              }
              onDelete={deleteProfile}
              onPin={(p) =>
                void perform("saveProfile", {
                  profile: { ...p, pinned: !p.pinned },
                })
              }
              onNavigate={setPage}
            />
          )}
          <div
            className="terminal-workspace"
            style={{ display: page === "terminal" ? "flex" : "none" }}
          >
            <div className="terminal-toolbar">
              <span>
                <TerminalSquare size={16} />
                {activeSession?.name || "Terminal workspace"}
              </span>
              <div>
                <button
                  onClick={() => setSplit((v) => !v)}
                  className={split ? "active" : ""}
                >
                  <SplitSquareHorizontal size={14} />
                  {split ? "Single pane" : "Split view"}
                </button>
                <button onClick={() => void local()}>
                  <Plus size={14} />
                  Local shell
                </button>
              </div>
            </div>
            {sessions.length === 0 ? (
              <Empty
                title="No terminal sessions"
                description="Connect to a server or open a local shell. Sessions stay active when you switch views."
                action={
                  <button className="primary" onClick={() => void local()}>
                    <TerminalSquare size={16} />
                    Open local terminal
                  </button>
                }
              />
            ) : (
              <div className={split ? "terminal-grid split" : "terminal-grid"}>
                {sessions.map((s) => (
                  <TerminalPane
                    key={s.id}
                    session={s}
                    visible={
                      page === "terminal" &&
                      (s.id === active ||
                        (split &&
                          s.id === sessions.find((x) => x.id !== active)?.id))
                    }
                    settings={settings}
                    onError={error}
                  />
                ))}
              </div>
            )}
          </div>
          {page === "files" && (
            <Files
              sessions={sessions}
              transfers={state.transfers || []}
              error={error}
            />
          )}
          {page === "keys" && (
            <>
              <PageHeading
                eyebrow=""
                title="Key manager"
                description="Private keys live in your operating system’s secure storage."
                action={
                  <button className="primary" onClick={() => setKeyForm(true)}>
                    <Plus size={16} />
                    Add key
                  </button>
                }
              />
              <div className="info-banner">
                <ShieldCheck size={19} />
                <div>
                  <b>Local by design</b>
                  <span>
                    Only public key metadata is included in backups. Re-import
                    private keys when you move to a new device.
                  </span>
                </div>
              </div>
              {keys.length === 0 ? (
                <Empty
                  title="No SSH keys"
                  description="Import an existing private key or generate a new key pair. Re-import keys on each device."
                  action={
                    <button onClick={() => setKeyForm(true)}>
                      <KeyRound size={16} />
                      Add your first key
                    </button>
                  }
                />
              ) : (
                <div className="panel">
                  {keys.map((k) => (
                    <div className="key-row" key={k.id}>
                      <div className="key-icon">
                        <KeyRound size={20} />
                      </div>
                      <div className="grow">
                        <h3>
                          {k.name}
                          <span className="tag">{k.type}</span>
                        </h3>
                        <code>{k.fingerprint}</code>
                        <small>
                          {k.group || "Personal"} · Added {date(k.created)}
                        </small>
                      </div>
                      <button
                        title="Copy public key"
                        onClick={() =>
                          void navigator.clipboard
                            .writeText(k.publicKey)
                            .then(() => error("Public key copied"))
                            .catch(error)
                        }
                      >
                        <Copy size={14} />
                        Public key
                      </button>
                      <button
                        className="icon danger"
                        title="Delete key"
                        onClick={() =>
                          setConfirm({
                            title: "Delete this private key?",
                            description:
                              "This removes the private key from this device’s secure storage. Keep your own backup before deleting it.",
                            op: "deleteKey",
                            id: k.id,
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {page === "snippets" && (
            <>
              <PageHeading
                eyebrow=""
                title="Command snippets"
                description="Keep useful commands close. Paste first, or run when you’re ready."
                action={
                  <button
                    className="primary"
                    onClick={() =>
                      setSnippet({
                        id: "",
                        name: "",
                        command: "",
                        category: "System",
                      })
                    }
                  >
                    <Plus size={16} />
                    New snippet
                  </button>
                }
              />
              <div className="info-banner">
                <TerminalSquare size={18} />
                <div>
                  <b>
                    {activeSession
                      ? `Target: ${activeSession.name}`
                      : "No target terminal selected"}
                  </b>
                  <span>
                    Select a terminal tab before using a snippet. HOST, USER and
                    PORT variables use that session’s profile.
                  </span>
                </div>
              </div>
              {snippets.length === 0 ? (
                <Empty
                  title="Your best commands, saved"
                  description="Save deployment commands, diagnostics, and everyday shortcuts."
                  action={
                    <button
                      onClick={() =>
                        setSnippet({
                          id: "",
                          name: "",
                          command: "",
                          category: "System",
                        })
                      }
                    >
                      Create snippet
                    </button>
                  }
                />
              ) : (
                <div className="snippet-grid">
                  {snippets.map((n) => (
                    <article className="panel snippet-card" key={n.id}>
                      <div className="panel-heading">
                        <h3>{n.name}</h3>
                        <span className="tag">{n.category}</span>
                      </div>
                      <pre>{n.command}</pre>
                      <footer>
                        <button
                          className="icon"
                          title="Edit snippet"
                          onClick={() => setSnippet({ ...n })}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon danger"
                          title="Delete snippet"
                          onClick={() =>
                            setConfirm({
                              title: "Delete snippet?",
                              description: n.name,
                              op: "deleteSnippet",
                              id: n.id,
                            })
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="grow" />
                        <button
                          disabled={
                            !activeSession ||
                            activeSession.status !== "connected"
                          }
                          onClick={() => void useSnippet(n, false)}
                        >
                          Paste
                        </button>
                        <button
                          className="primary"
                          disabled={
                            !activeSession ||
                            activeSession.status !== "connected"
                          }
                          onClick={() => void useSnippet(n, true)}
                        >
                          Run
                          <ArrowRight size={14} />
                        </button>
                      </footer>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
          {page === "tunnels" && (
            <>
              <PageHeading
                eyebrow=""
                title="Port forwarding"
                description="Local, remote, and SOCKS5 tunnels over an active SSH connection."
                action={
                  <button
                    className="primary"
                    onClick={() =>
                      setTunnel({
                        id: "",
                        name: "",
                        profileId: profiles[0]?.id || "",
                        type: "local",
                        bind: "127.0.0.1:8080",
                        destination: "127.0.0.1:80",
                      })
                    }
                  >
                    <Plus size={16} />
                    New tunnel
                  </button>
                }
              />
              <div className="info-banner">
                <Shield size={18} />
                <div>
                  <b>Loopback listeners</b>
                  <span>
                    Listeners are restricted to this computer (or the remote
                    host for remote forwarding). Connect the associated profile
                    before starting a tunnel.
                  </span>
                </div>
              </div>
              {tunnels.length === 0 ? (
                <Empty
                  title="Bring remote services closer"
                  description="Reach a remote database, forward a local service, or route traffic through SOCKS5."
                  action={
                    <button
                      onClick={() =>
                        setTunnel({
                          id: "",
                          name: "",
                          profileId: profiles[0]?.id || "",
                          type: "local",
                          bind: "127.0.0.1:8080",
                          destination: "127.0.0.1:80",
                        })
                      }
                    >
                      Create tunnel
                    </button>
                  }
                />
              ) : (
                <div className="tunnel-grid">
                  {tunnels.map((t) => {
                    const running = state.runningTunnels?.includes(t.id);
                    return (
                      <article className="panel tunnel-card" key={t.id}>
                        <div className="panel-heading">
                          <div className="tunnel-icon">
                            <Network size={21} />
                          </div>
                          <span
                            className={`status-pill ${running ? "green" : ""}`}
                          >
                            <i
                              className={`dot ${running ? "connected" : ""}`}
                            />
                            {running ? "Running" : "Stopped"}
                          </span>
                        </div>
                        <h3>{t.name}</h3>
                        <p>
                          {profiles.find((p) => p.id === t.profileId)?.name ||
                            "Missing profile"}{" "}
                          ·{" "}
                          {t.type === "dynamic"
                            ? "SOCKS5"
                            : t.type + " forwarding"}
                        </p>
                        <div className="tunnel-route">
                          <code>{t.bind}</code>
                          <ArrowRight size={16} />
                          <code>
                            {t.type === "dynamic"
                              ? "SOCKS5 CONNECT"
                              : t.destination}
                          </code>
                        </div>
                        <footer>
                          <button
                            className="icon"
                            title="Edit tunnel"
                            disabled={running}
                            onClick={() => setTunnel({ ...t })}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="icon danger"
                            title="Delete tunnel"
                            onClick={() =>
                              setConfirm({
                                title: "Delete tunnel?",
                                description:
                                  "Any running listener will be stopped.",
                                op: "deleteTunnel",
                                id: t.id,
                              })
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                          <div className="grow" />
                          <button
                            className={running ? "" : "primary"}
                            onClick={() =>
                              void perform(
                                running ? "stopTunnel" : "startTunnel",
                                { id: t.id },
                              )
                            }
                          >
                            {running ? "Stop tunnel" : "Start tunnel"}
                            <ArrowRight size={14} />
                          </button>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {page === "activity" && (
            <>
              <PageHeading
                eyebrow=""
                title="Connection log"
                description="Recent session events stored inside your encrypted vault."
              />
              <div className="panel">
                <div className="panel-heading">
                  <h3>Recent activity</h3>
                  <span>Last 500 events</span>
                </div>
                {state.data?.history.length === 0 ? (
                  <Empty
                    title="No connection events"
                    description="Connection activity appears here as you use your workspace."
                  />
                ) : (
                  state.data?.history.map((h) => (
                    <div className="activity-row" key={h.id}>
                      <div className="activity-icon">
                        <Activity size={17} />
                      </div>
                      <div className="grow">
                        <b>{h.name}</b>
                        <small>{h.detail}</small>
                      </div>
                      <span className="tag">{h.status}</span>
                      <time>{date(h.time)}</time>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          {page === "settings" && (
            <>
              <PageHeading
                eyebrow=""
                title="Preferences"
                description="Terminal display, inactivity locking and host verification."
              />
              <section className="panel settings-panel">
                <div>
                  <h3>Terminal appearance</h3>
                  <p>Applied to all open terminal sessions.</p>
                </div>
                <div className="form-grid">
                  <Field label="Font size">
                    <select
                      value={settings.fontSize}
                      onChange={(e) =>
                        setSettings({ ...settings, fontSize: +e.target.value })
                      }
                    >
                      {[12, 13, 14, 15, 16, 18, 20, 24].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Scrollback lines">
                    <input
                      type="number"
                      min="100"
                      max="100000"
                      value={settings.scrollback}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          scrollback: +e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field
                    label="Lock after inactivity"
                    hint="Locking also disconnects sessions and stops tunnels."
                  >
                    <select
                      value={settings.idleMinutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          idleMinutes: +e.target.value,
                        })
                      }
                    >
                      {[5, 10, 15, 30, 60, 120].map((n) => (
                        <option key={n} value={n}>
                          {n} minutes
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <button
                  className="primary"
                  onClick={() =>
                    void perform("settings", { settings }).then((v) => {
                      if (v) error("Preferences saved");
                    })
                  }
                >
                  Save preferences
                </button>
              </section>
              <section className="panel settings-panel">
                <div>
                  <h3>Host-key trust</h3>
                  <p>
                    Verify fingerprints with your server administrator before
                    trusting a new host.
                  </p>
                </div>
                {state.data?.hosts.length === 0 ? (
                  <p className="muted">No trusted hosts yet.</p>
                ) : (
                  state.data?.hosts.map((h) => (
                    <div className="known-host" key={h.host}>
                      <div>
                        <b>{h.host}</b>
                        <code>{h.fingerprint}</code>
                      </div>
                      <button
                        className="icon danger"
                        title="Forget host"
                        onClick={() =>
                          setConfirm({
                            title: "Forget this host key?",
                            description: `${h.host} will require verification on the next connection.`,
                            op: "forgetHost",
                            id: h.host,
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </section>
              <section className="panel settings-panel">
                <h3>Change master password</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const f = new FormData(form);
                    if (f.get("newPassword") !== f.get("confirmPassword")) {
                      error("New passwords do not match");
                      return;
                    }
                    const result = await perform("changePassword", {
                      password: f.get("oldPassword"),
                      newPassword: f.get("newPassword"),
                    });
                    if (result) {
                      form.reset();
                      error("Master password changed");
                    }
                  }}
                >
                  <div className="form-grid">
                    <Field label="Current password">
                      <input
                        type="password"
                        name="oldPassword"
                        required
                        autoComplete="current-password"
                      />
                    </Field>
                    <Field label="New password">
                      <input
                        type="password"
                        name="newPassword"
                        minLength={12}
                        required
                        autoComplete="new-password"
                      />
                    </Field>
                    <Field label="Confirm new password">
                      <input
                        type="password"
                        name="confirmPassword"
                        minLength={12}
                        required
                        autoComplete="new-password"
                      />
                    </Field>
                  </div>
                  <button>Change password</button>
                </form>
              </section>
              <div className="about-row">
                <Logo />
                <span>NomadSSH · SSH client built in Go</span>
                <code>{state.dataPath}</code>
              </div>
            </>
          )}
          {page === "sync" && (
            <>
              <PageHeading
                eyebrow=""
                title="Backup & sync"
                description="Encrypted metadata that you control. Private keys remain on this device."
              />
              <div className="backup-grid">
                <section className="panel backup-card">
                  <div className="backup-icon">
                    <HardDrive size={26} />
                  </div>
                  <h2>Encrypted backup</h2>
                  <p>
                    Export your profiles, snippets, preferences, and key
                    metadata in an authenticated encrypted vault. The master
                    password is needed to restore it.
                  </p>
                  <button
                    className="primary"
                    onClick={async () => {
                      try {
                        const path = await saveFile();
                        if (path) {
                          const ok = await perform("export", { path });
                          if (ok) error("Encrypted backup saved");
                        }
                      } catch (e) {
                        error(e);
                      }
                    }}
                  >
                    <ArrowDownToLine size={16} />
                    Export backup
                  </button>
                </section>
                <section className="panel backup-card">
                  <div className="backup-icon">
                    <FolderSync size={26} />
                  </div>
                  <h2>Restore workspace</h2>
                  <p>
                    Import an encrypted backup into this vault. This replaces
                    metadata; private keys must be re-imported on a new device.
                  </p>
                  <button onClick={() => setRestoreOpen(true)}>
                    <Folder size={16} />
                    Restore backup
                  </button>
                </section>
              </div>
              <DrivePanel error={error} onRestore={refresh} />
            </>
          )}
        </main>
        <footer className="statusbar">
          <div>
            <span>
              <i className="dot connected" />
              Vault encrypted locally
            </span>
            <span>
              <Link2 size={12} />
              {connected.length} active{" "}
              {connected.length === 1 ? "session" : "sessions"}
            </span>
          </div>
          <div>
            <span>Private keys: local only</span>
            <span>v{state.version}</span>
          </div>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button
            className="icon"
            onClick={() => setToast("")}
            aria-label="Dismiss message"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {closeAll && (
        <Modal title="Close all sessions?" onClose={() => setCloseAll(false)}>
          <p className="pad">
            This disconnects all SSH and local terminal sessions and cancels
            their file transfers and tunnels.
          </p>
          <footer>
            <button onClick={() => setCloseAll(false)}>Cancel</button>
            <button
              className="danger"
              onClick={async () => {
                for (const session of sessions) await closeSession(session.id);
                setCloseAll(false);
              }}
            >
              Close all sessions
            </button>
          </footer>
        </Modal>
      )}
      {quitRequested && (
        <Modal title="Exit NomadSSH?" onClose={() => setQuitRequested(false)}>
          <p className="pad">
            Active sessions, transfers and tunnels will be closed.
          </p>
          <footer>
            <button autoFocus onClick={() => setQuitRequested(false)}>
              Keep working
            </button>
            <button onClick={() => void Call.ByName("main.App.ConfirmQuit")}>
              Exit
            </button>
          </footer>
        </Modal>
      )}
      {about && (
        <Modal title="About NomadSSH" onClose={() => setAbout(false)}>
          <div className="about-dialog">
            <Logo />
            <p>Desktop SSH client built in Go.</p>
            <dl>
              <div>
                <dt>Version</dt>
                <dd>{state.version}</dd>
              </div>
              <div>
                <dt>Interface</dt>
                <dd>Wails · React · xterm.js</dd>
              </div>
              <div>
                <dt>Workspace</dt>
                <dd>{state.dataPath}</dd>
              </div>
            </dl>
            <p>
              Private keys remain in this device’s OS keychain. Drive stores
              encrypted workspace snapshots.
            </p>
          </div>
          <footer>
            <button onClick={() => setAbout(false)}>Close</button>
          </footer>
        </Modal>
      )}
      {profile && (
        <ProfileForm
          initial={profile}
          keys={keys}
          profiles={profiles}
          onClose={() => setProfile(undefined)}
          onSave={async (p, connectAfterSave) => {
            setBusy(true);
            const result = await perform<Profile>("saveProfile", {
              profile: p,
            });
            setBusy(false);
            if (result) {
              setProfile(undefined);
              setSelected(result.id);
              if (connectAfterSave) await connect(result.id);
            }
          }}
          busy={busy}
        />
      )}
      {keyForm && (
        <KeyForm
          onClose={() => setKeyForm(false)}
          onSave={async (fields) => {
            setBusy(true);
            const result = await perform(
              fields.type === "import" ? "importKey" : "generateKey",
              fields,
            );
            setBusy(false);
            if (result) setKeyForm(false);
          }}
          busy={busy}
          error={error}
        />
      )}
      {snippet && (
        <Modal
          title={snippet.id ? "Edit snippet" : "New snippet"}
          onClose={() => setSnippet(undefined)}
          subtitle="Use ${HOST}, ${USER}, and ${PORT} for the active connection."
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await perform("saveSnippet", { snippet }))
                setSnippet(undefined);
            }}
          >
            <div className="form-grid">
              <Field label="Name">
                <input
                  required
                  value={snippet.name}
                  onChange={(e) =>
                    setSnippet({ ...snippet, name: e.target.value })
                  }
                />
              </Field>
              <Field label="Category">
                <select
                  value={snippet.category}
                  onChange={(e) =>
                    setSnippet({ ...snippet, category: e.target.value })
                  }
                >
                  {[
                    "System",
                    "Network",
                    "Docker",
                    "Git",
                    "Database",
                    "Custom",
                  ].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </Field>
              <Field label="Command" wide>
                <textarea
                  required
                  rows={5}
                  value={snippet.command}
                  onChange={(e) =>
                    setSnippet({ ...snippet, command: e.target.value })
                  }
                />
              </Field>
            </div>
            <footer>
              <button type="button" onClick={() => setSnippet(undefined)}>
                Cancel
              </button>
              <button className="primary">Save snippet</button>
            </footer>
          </form>
        </Modal>
      )}
      {tunnel && (
        <Modal
          title={tunnel.id ? "Edit tunnel" : "New tunnel"}
          onClose={() => setTunnel(undefined)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await perform("saveTunnel", { tunnel })) setTunnel(undefined);
            }}
          >
            <div className="form-grid">
              <Field label="Name">
                <input
                  required
                  value={tunnel.name}
                  onChange={(e) =>
                    setTunnel({ ...tunnel, name: e.target.value })
                  }
                />
              </Field>
              <Field label="SSH profile">
                <select
                  required
                  value={tunnel.profileId}
                  onChange={(e) =>
                    setTunnel({ ...tunnel, profileId: e.target.value })
                  }
                >
                  <option value="">Choose profile</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Forwarding type">
                <select
                  value={tunnel.type}
                  onChange={(e) =>
                    setTunnel({ ...tunnel, type: e.target.value })
                  }
                >
                  <option value="local">Local forward</option>
                  <option value="remote">Remote forward</option>
                  <option value="dynamic">Dynamic SOCKS5</option>
                </select>
              </Field>
              <Field label="Listen address">
                <input
                  required
                  value={tunnel.bind}
                  onChange={(e) =>
                    setTunnel({ ...tunnel, bind: e.target.value })
                  }
                />
              </Field>
              {tunnel.type !== "dynamic" && (
                <Field label="Destination host:port" wide>
                  <input
                    required
                    value={tunnel.destination}
                    onChange={(e) =>
                      setTunnel({ ...tunnel, destination: e.target.value })
                    }
                  />
                </Field>
              )}
            </div>
            <footer>
              <button type="button" onClick={() => setTunnel(undefined)}>
                Cancel
              </button>
              <button className="primary">Save tunnel</button>
            </footer>
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(undefined)}>
          <p className="pad">{confirm.description}</p>
          <footer>
            <button onClick={() => setConfirm(undefined)}>Cancel</button>
            <button
              className="danger"
              onClick={async () => {
                if (await perform(confirm.op, { id: confirm.id })) {
                  setConfirm(undefined);
                  setSelected(undefined);
                }
              }}
            >
              Delete
            </button>
          </footer>
        </Modal>
      )}
      {prompts[0] && (
        <Modal
          title={
            prompts[0].data.oldFingerprint
              ? "Host key has changed"
              : "Verify this server"
          }
          subtitle={prompts[0].data.host}
          onClose={() => void answerTrust(false)}
        >
          <div className="trust-body">
            <Shield
              size={32}
              className={prompts[0].data.oldFingerprint ? "orange" : "cyan"}
            />
            <p>
              {prompts[0].data.oldFingerprint
                ? "The server’s identity differs from the key you previously trusted. This could indicate an interception or a server reinstall. Confirm the new fingerprint through a separate trusted channel."
                : "This is your first connection to this host. Verify the fingerprint through a separate trusted channel before continuing."}
            </p>
            <small>{prompts[0].data.type}</small>
            <code>{prompts[0].data.fingerprint}</code>
            {prompts[0].data.oldFingerprint && (
              <>
                <small>Previously trusted</small>
                <code>{prompts[0].data.oldFingerprint}</code>
              </>
            )}
          </div>
          <footer>
            <button onClick={() => void answerTrust(false)}>Reject</button>
            <button className="primary" onClick={() => void answerTrust(true)}>
              Trust this fingerprint
            </button>
          </footer>
        </Modal>
      )}
      {palette && (
        <Modal title="Command palette" onClose={() => setPalette(false)}>
          <CommandPalette
            profiles={profiles}
            onNavigate={(id) => {
              setPage(id);
              setPalette(false);
            }}
            onConnect={(id) => {
              setPalette(false);
              void connect(id);
            }}
            onLocal={() => {
              setPalette(false);
              void local();
            }}
          />
        </Modal>
      )}
      {restoreOpen && (
        <Modal
          title="Restore encrypted metadata"
          subtitle="This replaces the current workspace metadata."
          onClose={() => setRestoreOpen(false)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await perform("restore", {
                  path: f.get("path"),
                  password: f.get("password"),
                })
              ) {
                setRestoreOpen(false);
                error("Metadata restored. Re-import any missing private keys.");
              }
            }}
          >
            <div className="form-grid">
              <Field label="Backup file path" wide>
                <div className="input-with-button">
                  <input
                    required
                    name="path"
                    value={restorePath}
                    onChange={(e) => setRestorePath(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setRestorePath(await chooseFile());
                      } catch (e) {
                        error(e);
                      }
                    }}
                  >
                    <Folder size={16} />
                  </button>
                </div>
              </Field>
              <Field label="Backup master password" wide>
                <input name="password" type="password" required />
              </Field>
            </div>
            <footer>
              <button type="button" onClick={() => setRestoreOpen(false)}>
                Cancel
              </button>
              <button className="primary">Replace metadata</button>
            </footer>
          </form>
        </Modal>
      )}
    </div>
  );
  async function answerTrust(accepted: boolean) {
    const current = prompts[0];
    if (!current) return;
    await perform("trust", { id: current.id, accepted });
    setPrompts((p) => p.filter((v) => v.id !== current.id));
  }
  async function useSnippet(n: Snippet, execute: boolean) {
    if (!activeSession) return;
    const p = profiles.find((p) => p.id === activeSession.profileId);
    const vars: Record<string, string> = {
      HOST: p?.host || "",
      USER: p?.username || "",
      PORT: String(p?.port || ""),
    };
    let missing = false;
    const command = n.command.replace(/\$\{([A-Z_]+)\}/g, (_all, name) => {
      if (!(name in vars) || !vars[name]) missing = true;
      return vars[name] || "";
    });
    if (missing) {
      error(
        "This snippet needs variables unavailable in the selected session. Edit the snippet before running.",
      );
      return;
    }
    if (
      await perform("write", {
        id: activeSession.id,
        data: command + (execute ? "\r" : ""),
      })
    ) {
      setPage("terminal");
      terminals.get(activeSession.id)?.focus();
    }
  }
}

function Logo() {
  return (
    <div className="logo">
      <span className="logo-mark">
        <TerminalSquare size={23} />
      </span>
      <span>
        Nomad<span className="logo-light">SSH</span>
      </span>
    </div>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function CommandPalette({
  profiles,
  onNavigate,
  onConnect,
  onLocal,
}: {
  profiles: Profile[];
  onNavigate: (id: string) => void;
  onConnect: (id: string) => void;
  onLocal: () => void;
}) {
  const [q, setQ] = useState("");
  return (
    <div className="palette">
      <label className="search-input">
        <Search size={17} />
        <input
          autoFocus
          placeholder="Find a connection or action…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      <button onClick={onLocal}>
        <TerminalSquare size={17} />
        Open local terminal
        <ArrowRight size={15} />
      </button>
      {navigation
        .filter((n) => n.label.toLowerCase().includes(q.toLowerCase()))
        .map((n) => (
          <button key={n.id} onClick={() => onNavigate(n.id)}>
            <n.icon size={17} />
            {n.label}
            <ArrowRight size={15} />
          </button>
        ))}
      {profiles
        .filter((p) =>
          `${p.name} ${p.host}`.toLowerCase().includes(q.toLowerCase()),
        )
        .map((p) => (
          <button key={p.id} onClick={() => onConnect(p.id)}>
            <Server size={17} />
            {p.name}
            <code>{p.host}</code>
          </button>
        ))}
    </div>
  );
}
