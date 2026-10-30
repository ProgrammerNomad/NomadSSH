import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  ArrowUp,
  Folder,
  File,
  RefreshCw,
  FolderPlus,
  Pencil,
  Trash2,
  Shield,
  ArrowRightLeft,
} from "lucide-react";
import { api, Listing, FileInfo, Session, Transfer, bytes } from "./api";
import { Empty, Modal, Field } from "./ui";
export default function Files({
  sessions,
  transfers,
  error,
}: {
  sessions: Session[];
  transfers: Transfer[];
  error: (e: unknown) => void;
}) {
  const requests = useRef({ local: 0, remote: 0 });
  useEffect(
    () => () => {
      requests.current.local++;
      requests.current.remote++;
    },
    [],
  );
  const [session, setSession] = useState(
    sessions.find((s) => !s.local && s.status === "connected")?.id || "",
  );
  const [local, setLocal] = useState<Listing>();
  const [remote, setRemote] = useState<Listing>();
  const [left, setLeft] = useState<FileInfo>();
  const [right, setRight] = useState<FileInfo>();
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ local: "", remote: "" });
  const [sorting, setSorting] = useState({ local: "name", remote: "name" });
  const [edit, setEdit] = useState<{
    remote: boolean;
    type: string;
    path: string;
    value: string;
  }>();
  const load = async (isRemote: boolean, path = "") => {
    const side = isRemote ? "remote" : "local";
    const generation = ++requests.current[side];
    try {
      const result = await api<Listing>("listFiles", {
        id: session,
        path,
        remote: isRemote,
      });
      if (generation !== requests.current[side]) return;
      if (isRemote) {
        setRemote(result);
        setRight(undefined);
      } else {
        setLocal(result);
        setLeft(undefined);
      }
    } catch (e) {
      if (generation === requests.current[side]) error(e);
    }
  };
  useEffect(() => {
    void load(false);
  }, []);
  useEffect(() => {
    requests.current.remote++;
    setRemote(undefined);
    setRight(undefined);
    if (session) void load(true);
  }, [session]);
  useEffect(() => {
    if (
      session &&
      !sessions.some((s) => s.id === session && s.status === "connected")
    )
      setSession("");
  }, [sessions, session]);
  const transfer = async (download: boolean) => {
    const file = download ? right : left;
    const target = download ? local : remote;
    if (!file || !target) return;
    const separator = download
      ? target.path.includes("\\")
        ? "\\"
        : "/"
      : "/";
    try {
      setBusy(true);
      await api("transfer", {
        id: session,
        path: file.path,
        destination: target.path.replace(/[\\/]$/, "") + separator + file.name,
        remote: download,
      });
    } catch (e) {
      error(e);
    } finally {
      setBusy(false);
    }
  };
  const action = async () => {
    if (!edit) return;
    try {
      const args = {
        id: session,
        remote: edit.remote,
        type: edit.type,
        path:
          edit.type === "mkdir"
            ? edit.path.replace(/[\\/]$/, "") +
              (edit.remote ? "/" : edit.path.includes("\\") ? "\\" : "/") +
              edit.value
            : edit.path,
        destination: edit.value,
        mode: edit.value,
      };
      await api("fileAction", args);
      await load(edit.remote, (edit.remote ? remote : local)?.path);
      setEdit(undefined);
    } catch (e) {
      error(e);
    }
  };
  const pane = (isRemote: boolean) => {
    const listing = isRemote ? remote : local;
    const selected = isRemote ? right : left;
    const select = isRemote ? setRight : setLeft;
    const side = isRemote ? "remote" : "local";
    const visibleFiles =
      listing?.files
        .filter((f) =>
          f.name
            .toLocaleLowerCase()
            .includes(filters[side].toLocaleLowerCase()),
        )
        .sort((a, b) => {
          if (a.directory !== b.directory) return a.directory ? -1 : 1;
          if (sorting[side] === "size")
            return b.size - a.size || a.name.localeCompare(b.name);
          if (sorting[side] === "modified")
            return (
              Date.parse(b.modified) - Date.parse(a.modified) ||
              a.name.localeCompare(b.name)
            );
          return a.name.localeCompare(b.name, undefined, { numeric: true });
        }) || [];
    return (
      <section className="file-pane">
        <div className="pane-title">
          <span>
            <span className={`dot ${isRemote && session ? "connected" : ""}`} />
            {isRemote ? "Remote filesystem" : "This computer"}
          </span>
          <div>
            <button
              className="icon"
              aria-label={
                isRemote ? "Remote parent directory" : "Local parent directory"
              }
              disabled={!listing}
              onClick={() => void load(isRemote, listing?.parent)}
            >
              <ArrowUp size={16} />
            </button>
            <button
              className="icon"
              aria-label={
                isRemote ? "Refresh remote files" : "Refresh local files"
              }
              disabled={isRemote && !session}
              onClick={() => void load(isRemote, listing?.path)}
            >
              <RefreshCw size={15} />
            </button>
            <button
              className="icon"
              aria-label={isRemote ? "New remote folder" : "New local folder"}
              disabled={!listing}
              onClick={() =>
                setEdit({
                  remote: isRemote,
                  type: "mkdir",
                  path: listing!.path,
                  value: "",
                })
              }
            >
              <FolderPlus size={17} />
            </button>
          </div>
        </div>
        <form
          className="pathbar"
          onSubmit={(e) => {
            e.preventDefault();
            void load(
              isRemote,
              String(new FormData(e.currentTarget).get("path")),
            );
          }}
        >
          <Folder size={15} />
          <input
            key={listing?.path || "empty"}
            name="path"
            aria-label={isRemote ? "Remote path" : "Local path"}
            defaultValue={listing?.path || ""}
            placeholder={isRemote ? "Connect a session to browse" : "Loading…"}
          />
        </form>
        <div className="file-filter">
          <input
            aria-label={isRemote ? "Filter remote files" : "Filter local files"}
            placeholder="Filter files…"
            value={filters[side]}
            onChange={(e) => {
              setFilters({ ...filters, [side]: e.target.value });
              select(undefined);
            }}
          />
          <select
            aria-label={isRemote ? "Sort remote files" : "Sort local files"}
            value={sorting[side]}
            onChange={(e) => setSorting({ ...sorting, [side]: e.target.value })}
          >
            <option value="name">Name</option>
            <option value="size">Largest first</option>
            <option value="modified">Newest first</option>
          </select>
        </div>
        <div className="file-table">
          <div className="file-row file-head">
            <span>Name</span>
            <span>Size</span>
            <span>Modified</span>
            <span>Permissions</span>
          </div>
          {!listing ? (
            <Empty
              title={isRemote ? "Choose an SSH session" : "Loading files"}
              description={
                isRemote
                  ? "Open a connection, then select it above to browse securely."
                  : "Reading your home directory."
              }
            />
          ) : (
            visibleFiles.map((file) => (
              <button
                key={file.path}
                className={`file-row ${selected?.path === file.path ? "selected" : ""}`}
                onClick={() => select(file)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && file.directory) {
                    e.preventDefault();
                    void load(isRemote, file.path);
                  }
                }}
                onDoubleClick={() => {
                  if (file.directory) void load(isRemote, file.path);
                }}
              >
                <span>
                  {file.directory ? (
                    <Folder size={16} className="cyan" />
                  ) : (
                    <File size={15} />
                  )}{" "}
                  {file.name}
                  {file.symlink ? " ↗" : ""}
                </span>
                <span>{file.directory ? "—" : bytes(file.size)}</span>
                <time title={new Date(file.modified).toLocaleString()}>
                  {new Date(file.modified).toLocaleDateString()}
                </time>
                <code>{file.permissions}</code>
              </button>
            ))
          )}
          {listing && visibleFiles.length === 0 && (
            <p className="pad muted">
              {filters[side] ? "No matching files." : "This folder is empty."}
            </p>
          )}
        </div>
        <div className="pane-footer">
          <span>
            {visibleFiles.length} of {listing?.files.length || 0} items
          </span>
          <div>
            <button
              className="icon"
              title="Rename or move"
              disabled={!selected}
              onClick={() =>
                setEdit({
                  remote: isRemote,
                  type: "rename",
                  path: selected!.path,
                  value: selected!.path,
                })
              }
            >
              <Pencil size={14} />
            </button>
            {isRemote && (
              <button
                className="icon"
                title="Edit permissions"
                disabled={!selected}
                onClick={() =>
                  setEdit({
                    remote: true,
                    type: "chmod",
                    path: selected!.path,
                    value: "644",
                  })
                }
              >
                <Shield size={14} />
              </button>
            )}
            <button
              className="icon danger"
              title="Delete selected file or empty folder"
              disabled={!selected}
              onClick={() =>
                setEdit({
                  remote: isRemote,
                  type: "delete",
                  path: selected!.path,
                  value: "",
                })
              }
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </section>
    );
  };
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow"></span>
          <h1>File transfer</h1>
          <p>Browse and transfer files over SSH.</p>
        </div>
        <select
          value={session}
          onChange={(e) => setSession(e.target.value)}
          aria-label="SSH session for SFTP"
        >
          <option value="">Choose SSH session</option>
          {sessions
            .filter((s) => s.status === "connected" && !s.local)
            .map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </div>
      <div className="transfer-toolbar">
        <span>
          <Shield size={14} /> Encrypted over your SSH connection
        </span>
        <div>
          <button
            disabled={!left || !remote || busy}
            onClick={() => void transfer(false)}
          >
            <ArrowUpToLine size={15} />
            Upload
          </button>
          <button
            disabled={!right || !local || busy}
            onClick={() => void transfer(true)}
          >
            <ArrowDownToLine size={15} />
            Download
          </button>
        </div>
      </div>
      <div className="file-panes">
        {pane(false)}
        {pane(true)}
      </div>
      <section className="panel transfer-list">
        <div className="panel-heading">
          <h3>
            <ArrowRightLeft size={16} /> Transfer queue
          </h3>
          <span>
            {
              transfers.filter(
                (t) => t.status === "transferring" || t.status === "queued",
              ).length
            }{" "}
            active
          </span>
        </div>
        {transfers.length === 0 ? (
          <p className="muted pad">
            Select a file or folder and choose upload or download. Existing
            files are protected from overwrites.
          </p>
        ) : (
          transfers.map((t) => (
            <div className="transfer-row" key={t.id}>
              <div>
                <b>{t.name}</b>
                <small>
                  {t.direction} · {t.status}
                  {t.error ? ` · ${t.error}` : ""}
                </small>
              </div>
              <progress max={t.total || 1} value={t.bytes} />
              <span>
                {bytes(t.bytes)} / {bytes(t.total)}
                <small>
                  {bytes(t.speed)}/s
                  {t.speed > 0 && t.status === "transferring"
                    ? ` · ${Math.ceil((t.total - t.bytes) / t.speed)}s remaining`
                    : ""}
                </small>
              </span>
              {["queued", "transferring"].includes(t.status) && (
                <>
                  <button
                    onClick={() =>
                      void api("pauseTransfer", { id: t.id }).catch(error)
                    }
                  >
                    Pause
                  </button>
                  <button
                    onClick={() =>
                      void api("cancelTransfer", { id: t.id }).catch(error)
                    }
                  >
                    Cancel
                  </button>
                </>
              )}
              {["paused", "cancelled", "error"].includes(t.status) && (
                <button
                  onClick={() =>
                    void api("resumeTransfer", { id: t.id }).catch(error)
                  }
                >
                  Resume / retry
                </button>
              )}
            </div>
          ))
        )}
      </section>
      {edit && (
        <Modal
          title={
            edit.type === "delete"
              ? "Delete this item?"
              : edit.type === "mkdir"
                ? "New folder"
                : edit.type === "chmod"
                  ? "Edit permissions"
                  : "Rename or move"
          }
          onClose={() => setEdit(undefined)}
          subtitle={edit.path}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action();
            }}
          >
            {edit.type === "delete" ? (
              <p className="pad">
                This permanently deletes the selected file or empty folder.
                Nonempty folders are protected.
              </p>
            ) : (
              <div className="form-grid">
                <Field
                  label={
                    edit.type === "chmod"
                      ? "Octal permissions"
                      : edit.type === "mkdir"
                        ? "Folder name"
                        : "New absolute path"
                  }
                  wide
                >
                  <input
                    required
                    value={edit.value}
                    onChange={(e) =>
                      setEdit({ ...edit, value: e.target.value })
                    }
                  />
                </Field>
              </div>
            )}
            <footer>
              <button type="button" onClick={() => setEdit(undefined)}>
                Cancel
              </button>
              <button className={edit.type === "delete" ? "danger" : "primary"}>
                Confirm
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </>
  );
}
