import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Server,
  Plus,
  Search,
  Settings2,
  KeyRound,
  FolderSync,
  Activity,
  LockKeyhole,
} from "lucide-react";
import { Profile, Session } from "./api";

interface Props {
  profiles: Profile[];
  sessions: Session[];
  selected?: string;
  demo?: boolean;
  onSelect: (id: string) => void;
  onConnect: (id: string) => void;
  onNew: () => void;
  onNavigate: (page: string) => void;
  onLock: () => void;
}
export default function Explorer(p: Props) {
  const [filter, setFilter] = useState("");
  const [closed, setClosed] = useState<string[]>([]);
  const groups = Array.from(
    new Set(p.profiles.map((v) => v.group || "Ungrouped")),
  ).sort();
  return (
    <aside className="explorer">
      <header>
        <span>Connection manager</span>
        <button
          className="icon"
          aria-label="New connection"
          title="New connection (Ctrl+N)"
          onClick={p.onNew}
        >
          <Plus size={15} />
        </button>
      </header>
      <label className="explorer-filter">
        <Search size={13} />
        <input
          aria-label="Find saved host"
          placeholder="Find host…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </label>
      <div className="tree-root">
        <Server size={14} />
        <b>{p.demo ? "Demo connections" : "Saved connections"}</b>
        <span>{p.profiles.length}</span>
      </div>
      <div className="host-tree" aria-label="Saved connections">
        {groups.map((group) => {
          const hosts = p.profiles.filter(
            (h) =>
              (h.group || "Ungrouped") === group &&
              `${h.name} ${h.host} ${h.username}`
                .toLowerCase()
                .includes(filter.toLowerCase()),
          );
          if (!hosts.length) return null;
          const expanded = filter !== "" || !closed.includes(group);
          return (
            <section key={group}>
              <button
                className="tree-group"
                aria-expanded={expanded}
                onClick={() =>
                  setClosed(
                    expanded
                      ? [...closed, group]
                      : closed.filter((g) => g !== group),
                  )
                }
              >
                {expanded ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
                <Folder size={14} />
                <span>{group}</span>
                <small>{hosts.length}</small>
              </button>
              {expanded &&
                hosts.map((h) => (
                  <button
                    key={h.id}
                    className={`tree-host ${p.selected === h.id ? "selected" : ""}`}
                    aria-current={p.selected === h.id ? "true" : undefined}
                    title={`${h.username}@${h.host}:${h.port} — double-click to connect`}
                    onClick={() => p.onSelect(h.id)}
                    onDoubleClick={() => p.onConnect(h.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        p.onConnect(h.id);
                      }
                    }}
                  >
                    <i
                      className={`dot ${p.sessions.some((s) => s.profileId === h.id && s.status === "connected") ? "connected" : ""}`}
                    />
                    <span>{h.name}</span>
                    {h.pinned && <small>★</small>}
                  </button>
                ))}
            </section>
          );
        })}
        {p.profiles.length === 0 && (
          <p className="tree-empty">
            No saved hosts.
            <br />
            Choose New connection to add one.
          </p>
        )}
      </div>
      <div className="explorer-tools">
        {[
          { id: "keys", name: "Key manager", icon: KeyRound },
          { id: "sync", name: "Backup & sync", icon: FolderSync },
          { id: "activity", name: "Connection log", icon: Activity },
          { id: "settings", name: "Preferences", icon: Settings2 },
        ].map((v) => (
          <button key={v.id} onClick={() => p.onNavigate(v.id)}>
            <v.icon size={14} />
            {v.name}
          </button>
        ))}
        <button onClick={p.onLock}>
          <LockKeyhole size={14} />
          Lock workspace<span>Ctrl+Shift+L</span>
        </button>
      </div>
    </aside>
  );
}
