import { useEffect, useRef, useState } from "react";
import {
  ArrowUpDown,
  Copy,
  Pencil,
  Pin,
  Plus,
  Search,
  Server,
  TerminalSquare,
  Trash2,
  Plug,
  FileText,
  PanelRight,
  PanelBottom,
} from "lucide-react";
import { Profile, Session, Host, History, date } from "./api";
import { Empty } from "./ui";

interface Props {
  profiles: Profile[];
  sessions: Session[];
  hosts: Host[];
  history: History[];
  selected?: string;
  onSelect: (id: string) => void;
  onConnect: (id: string) => void;
  onEdit: (p: Profile) => void;
  onNew: () => void;
  onDuplicate: (p: Profile) => void;
  onDelete: (p: Profile) => void;
  onPin: (p: Profile) => void;
  onNavigate: (page: string) => void;
}
export default function ConnectionsView(p: Props) {
  const [showProperties, setShowProperties] = useState(true);
  const [showLog, setShowLog] = useState(true);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<keyof Profile>("name");
  const [descending, setDescending] = useState(false);
  const [context, setContext] = useState<{
    x: number;
    y: number;
    profile: Profile;
  }>();
  const search = useRef<HTMLInputElement>(null);
  const selected = p.profiles.find((h) => h.id === p.selected) || p.profiles[0];
  const rows = p.profiles
    .filter((h) =>
      `${h.name} ${h.host} ${h.username} ${h.group} ${h.tags?.join(" ")}`
        .toLowerCase()
        .includes(filter.toLowerCase()),
    )
    .sort((a, b) => {
      const av = a[sort],
        bv = b[sort];
      return (
        (typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av || "").localeCompare(String(bv || ""))) *
        (descending ? -1 : 1)
      );
    });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!context) return;
    const close = () => setContext(undefined);
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", escape);
    };
  }, [context]);
  const status = (h: Profile) =>
    p.sessions.find((s) => s.profileId === h.id && s.status === "connected")
      ? "Connected"
      : p.sessions.some(
            (s) => s.profileId === h.id && s.status === "connecting",
          )
        ? "Connecting"
        : "Disconnected";
  const currentSession = p.sessions.find(
    (s) => s.profileId === selected?.id && s.status === "connected",
  );
  const known = p.hosts.find(
    (h) =>
      h.host ===
      `${selected?.host?.includes(":") ? "[" + selected.host + "]" : selected?.host}:${selected?.port}`,
  );
  return (
    <div className="connection-manager">
      <div className="view-title">
        <h1>Connections</h1>
        <span>
          {rows.length} of {p.profiles.length} hosts
        </span>
        <div className="grow" />
        <label className="inline-search">
          <Search size={14} />
          <input
            ref={search}
            aria-label="Filter connections"
            placeholder="Filter by name, host, user or tag"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
        <button
          className="icon"
          title="Toggle properties"
          aria-label="Toggle connection properties"
          aria-pressed={showProperties}
          onClick={() => setShowProperties((v) => !v)}
        >
          <PanelRight size={15} />
        </button>
        <button
          className="icon"
          title="Toggle log"
          aria-label="Toggle connection log"
          aria-pressed={showLog}
          onClick={() => setShowLog((v) => !v)}
        >
          <PanelBottom size={15} />
        </button>
      </div>
      <div className="manager-body">
        <section className="connection-table-pane">
          <div className="table-scroll">
            <table
              className="connection-table"
              aria-label="Saved SSH connections"
            >
              <thead>
                <tr>
                  {[
                    ["name", "Name"],
                    ["host", "Host"],
                    ["port", "Port"],
                    ["username", "User"],
                    ["auth", "Authentication"],
                    ["group", "Group"],
                  ].map(([field, label]) => (
                    <th key={field} scope="col">
                      <button
                        onClick={() => {
                          setDescending(sort === field ? !descending : false);
                          setSort(field as keyof Profile);
                        }}
                      >
                        {label}
                        {sort === field && <ArrowUpDown size={11} />}
                      </button>
                    </th>
                  ))}
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h, index) => (
                  <tr
                    key={h.id}
                    tabIndex={
                      h.id === selected?.id || (!selected && index === 0)
                        ? 0
                        : -1
                    }
                    aria-selected={h.id === selected?.id}
                    className={h.id === selected?.id ? "selected" : ""}
                    onClick={() => p.onSelect(h.id)}
                    onDoubleClick={() => p.onConnect(h.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      p.onSelect(h.id);
                      setContext({
                        x: Math.min(e.clientX, window.innerWidth - 200),
                        y: Math.min(e.clientY, window.innerHeight - 215),
                        profile: h,
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        p.onConnect(h.id);
                      }
                      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                        e.preventDefault();
                        const row =
                          rows[
                            Math.max(
                              0,
                              Math.min(
                                rows.length - 1,
                                index + (e.key === "ArrowDown" ? 1 : -1),
                              ),
                            )
                          ];
                        p.onSelect(row.id);
                        (
                          e.currentTarget.parentElement?.children[
                            rows.indexOf(row)
                          ] as HTMLElement
                        )?.focus();
                      }
                      if (e.key === "F2") {
                        e.preventDefault();
                        p.onEdit(h);
                      }
                      if (e.key === "Delete") {
                        e.preventDefault();
                        p.onDelete(h);
                      }
                    }}
                  >
                    <td>
                      <Server size={14} />
                      <b>{h.name}</b>
                      {h.pinned && <Pin size={11} />}
                    </td>
                    <td className="mono">{h.host}</td>
                    <td className="mono">{h.port}</td>
                    <td>{h.username}</td>
                    <td>
                      {h.auth === "key"
                        ? "Private key"
                        : h.auth === "agent"
                          ? "SSH agent"
                          : "Password"}
                    </td>
                    <td>{h.group || "Ungrouped"}</td>
                    <td>
                      <i
                        className={`dot ${status(h) === "Connected" ? "connected" : ""}`}
                      />
                      {status(h)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <Empty
                title={filter ? "No matching hosts" : "No saved connections"}
                description={
                  filter
                    ? "Change the filter to see more hosts."
                    : "Create a connection with a server address, username and authentication method."
                }
                action={
                  !filter && (
                    <button onClick={p.onNew}>
                      <Plus size={14} />
                      New connection
                    </button>
                  )
                }
              />
            )}
          </div>
          <footer className="table-footer">
            <span>Double-click or press Enter to connect</span>
            <span>F2 Edit · Delete Remove</span>
          </footer>
        </section>
        {showProperties && (
          <aside className="properties-pane">
            <header>
              <FileText size={14} />
              Connection properties
            </header>
            {selected ? (
              <>
                <div className="property-title">
                  <Server size={19} />
                  <div>
                    <h2>{selected.name}</h2>
                    <span>{status(selected)}</span>
                  </div>
                </div>
                <div className="property-actions">
                  <button
                    className="primary"
                    onClick={() => p.onConnect(selected.id)}
                  >
                    <Plug size={14} />
                    Connect
                  </button>
                  <button onClick={() => p.onEdit(selected)}>
                    <Pencil size={13} />
                    Edit
                  </button>
                </div>
                <dl>
                  {[
                    ["Host", selected.host],
                    ["Port", String(selected.port)],
                    ["User", selected.username],
                    ["Protocol", "SSH 2"],
                    [
                      "Authentication",
                      selected.auth === "key"
                        ? "Private key"
                        : selected.auth === "agent"
                          ? "SSH agent"
                          : "Password",
                    ],
                    [
                      "Jump host",
                      p.profiles.find((h) => h.id === selected.jumpId)?.name ||
                        "Direct connection",
                    ],
                    ["Group", selected.group || "Ungrouped"],
                    [
                      "Tags",
                      selected.tags?.filter(Boolean).join(", ") || "None",
                    ],
                    ["Last connected", date(selected.lastConnected)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="property-section">
                  <h3>Server identity</h3>
                  <p>
                    {known
                      ? "Saved host fingerprint"
                      : "The server fingerprint will be requested on first connection."}
                  </p>
                  {known && <code>{known.fingerprint}</code>}
                  {currentSession && (
                    <>
                      <h3>Server version</h3>
                      <code>
                        {currentSession.serverVersion || "Not reported"}
                      </code>
                    </>
                  )}
                </div>
                <div className="property-secondary">
                  <button onClick={() => p.onPin(selected)}>
                    <Pin size={13} />
                    {selected.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button onClick={() => p.onDuplicate(selected)}>
                    <Copy size={13} />
                    Duplicate
                  </button>
                  <button
                    className="icon danger"
                    aria-label="Delete selected connection"
                    onClick={() => p.onDelete(selected)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            ) : (
              <p className="pad">
                Select a connection to inspect its properties.
              </p>
            )}
          </aside>
        )}
      </div>
      {showLog && (
        <section className="connection-log">
          <header>
            <TerminalSquare size={13} />
            <b>Connection log</b>
            <div className="grow" />
            <button onClick={() => p.onNavigate("activity")}>View all</button>
          </header>
          <div className="log-entries">
            {p.history.length ? (
              p.history.slice(0, 4).map((h) => (
                <div key={h.id}>
                  <time>{new Date(h.time).toLocaleTimeString()}</time>
                  <span className={h.status === "error" ? "danger" : "muted"}>
                    {h.status}
                  </span>
                  <b>{h.name}</b>
                  <span>{h.detail}</span>
                </div>
              ))
            ) : (
              <p>No connection events in this workspace.</p>
            )}
          </div>
        </section>
      )}
      {context && (
        <div
          className="context-menu"
          role="menu"
          aria-label="Connection actions"
          style={{ left: context.x, top: context.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {[
            { label: "Connect", action: () => p.onConnect(context.profile.id) },
            {
              label: "Edit connection…",
              action: () => p.onEdit(context.profile),
            },
            {
              label: "Duplicate…",
              action: () => p.onDuplicate(context.profile),
            },
            {
              label: context.profile.pinned ? "Unpin" : "Pin",
              action: () => p.onPin(context.profile),
            },
            { label: "Delete…", action: () => p.onDelete(context.profile) },
          ].map((a) => (
            <button
              role="menuitem"
              key={a.label}
              onClick={() => {
                a.action();
                setContext(undefined);
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
