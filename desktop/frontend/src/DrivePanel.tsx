import { useEffect, useState } from "react";
import { Call } from "@wailsio/runtime";
import { Cloud, RefreshCw, Upload } from "lucide-react";
import { api, date } from "./api";
import { Field, Modal } from "./ui";

interface Status {
  clientId: string;
  autoSync: boolean;
  lastSync: string;
  connected: boolean;
}
interface Snapshot {
  id: string;
  name: string;
  createdTime: string;
  size: string;
}
export default function DrivePanel({
  error,
  onRestore,
}: {
  error: (e: unknown) => void;
  onRestore: () => Promise<void>;
}) {
  const [status, setStatus] = useState<Status>({
    clientId: "",
    autoSync: false,
    lastSync: "",
    connected: false,
  });
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selected, setSelected] = useState<Snapshot>();
  const load = async () => setStatus(await api<Status>("driveStatus"));
  useEffect(() => {
    void load().catch(error);
  }, []);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      error(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel settings-panel">
      <div className="panel-heading">
        <div>
          <h3>
            <Cloud size={19} /> Google Drive
          </h3>
          <p>
            Encrypted workspace snapshots in the app’s private Drive folder.
            Private keys stay on this device.
          </p>
        </div>
        <span className="tag">
          {status.connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await api("driveConfigure", {
              clientId: status.clientId,
              clientSecret: secret,
              autoSync: status.autoSync,
            });
            setSecret("");
            await load();
            error("Drive configuration saved");
          });
        }}
      >
        <div className="form-grid">
          <Field label="Google OAuth Desktop app client ID" wide>
            <input
              required
              placeholder="Your client ID ending in .apps.googleusercontent.com"
              value={status.clientId}
              onChange={(e) =>
                setStatus({ ...status, clientId: e.target.value })
              }
            />
          </Field>
          <Field
            label="Client secret"
            hint="If supplied by Google. Saved in your OS keychain; leave blank to keep the stored value."
            wide
          >
            <input
              type="password"
              autoComplete="off"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </Field>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={status.autoSync}
            onChange={(e) =>
              setStatus({ ...status, autoSync: e.target.checked })
            }
          />{" "}
          Upload changed metadata every minute while unlocked
        </label>
        <div className="heading-actions">
          <button disabled={busy} type="submit">
            Save configuration
          </button>
          <button
            type="button"
            disabled={busy || !status.clientId}
            onClick={() =>
              void run(async () => {
                await Call.ByName("main.App.ConnectDrive");
                error("Complete sign-in in your browser, then refresh status.");
              })
            }
          >
            Sign in with Google
          </button>
          <button type="button" disabled={busy} onClick={() => void run(load)}>
            <RefreshCw size={14} />
            Refresh status
          </button>
        </div>
      </form>
      <p className="muted">
        Last upload: {status.lastSync ? date(status.lastSync) : "None"}. Each
        upload creates a separate revision, preserving changes from other
        devices. Restore a revision explicitly; automatic merging is not
        available.
      </p>
      <div className="heading-actions">
        <button
          className="primary"
          disabled={busy || !status.connected}
          onClick={() =>
            void run(async () => {
              await api("driveUpload");
              await load();
              error("Encrypted snapshot saved to Drive");
            })
          }
        >
          <Upload size={15} />
          Upload snapshot
        </button>
        <button
          disabled={busy || !status.connected}
          onClick={() =>
            void run(async () =>
              setSnapshots(await api<Snapshot[]>("driveList")),
            )
          }
        >
          Browse snapshots
        </button>
      </div>
      {snapshots.map((s) => (
        <div className="activity-row" key={s.id}>
          <div className="grow">
            <b>{s.name}</b>
            <small>{date(s.createdTime)}</small>
          </div>
          <button onClick={() => setSelected(s)}>Restore…</button>
        </div>
      ))}
      {selected && (
        <Modal
          title="Restore Drive snapshot"
          subtitle="This replaces the current workspace metadata. Export a backup first if you want to keep it."
          onClose={() => setSelected(undefined)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const password = new FormData(e.currentTarget).get("password");
              void run(async () => {
                await api("driveRestore", { id: selected.id, password });
                setSelected(undefined);
                await onRestore();
                error(
                  "Workspace restored. Re-import any missing private keys.",
                );
              });
            }}
          >
            <div className="form-grid">
              <Field label="Snapshot master password" wide>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="off"
                />
              </Field>
            </div>
            <footer>
              <button type="button" onClick={() => setSelected(undefined)}>
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                Replace metadata
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </section>
  );
}
