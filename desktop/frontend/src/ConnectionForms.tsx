import { useState } from "react";
import { Check, Folder, Shield } from "lucide-react";
import { Profile, Key, chooseFile } from "./api";
import { Modal, Field } from "./ui";
export function ProfileForm({
  initial,
  keys,
  profiles,
  onSave,
  onClose,
  busy,
}: {
  initial: Profile;
  keys: Key[];
  profiles: Profile[];
  onSave: (p: Profile, connectAfterSave?: boolean) => Promise<void>;
  onClose: () => void;
  busy: boolean;
}) {
  const [p, setP] = useState(initial);
  const change = (name: string, value: unknown) =>
    setP({ ...p, [name]: value });
  return (
    <Modal
      title={p.id ? "Edit connection" : "New connection"}
      subtitle="Server address and authentication"
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const submitter = (e.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement | null;
          void onSave(p, submitter?.value === "connect");
        }}
      >
        <fieldset className="connection-fields">
          <legend>Server</legend>
          <div className="form-grid">
            <Field label="Connection name" wide>
              <input
                autoFocus
                required
                placeholder="Production server"
                value={p.name}
                onChange={(e) => change("name", e.target.value)}
              />
            </Field>
            <Field label="Hostname or IP address">
              <input
                required
                placeholder="server.example.com"
                value={p.host}
                onChange={(e) => change("host", e.target.value)}
              />
            </Field>
            <Field label="Port">
              <input
                type="number"
                required
                min={1}
                max={65535}
                value={p.port}
                onChange={(e) => change("port", +e.target.value)}
              />
            </Field>
          </div>
        </fieldset>
        <fieldset className="connection-fields">
          <legend>Authentication</legend>
          <div className="form-grid">
            <Field label="Username">
              <input
                required
                placeholder="deploy"
                value={p.username}
                onChange={(e) => change("username", e.target.value)}
              />
            </Field>
            <Field label="Authentication">
              <select
                value={p.auth}
                onChange={(e) => change("auth", e.target.value)}
              >
                <option value="password">Password</option>
                <option value="key">Private key</option>
                <option value="agent">SSH agent</option>
              </select>
            </Field>
            {p.auth === "password" && (
              <Field
                label="Password"
                hint={
                  p.id
                    ? "Leave blank to keep the existing password."
                    : "Saved only inside your encrypted vault."
                }
                wide
              >
                <input
                  type="password"
                  autoComplete="off"
                  value={p.password || ""}
                  onChange={(e) => change("password", e.target.value)}
                />
              </Field>
            )}
            {p.auth === "key" && (
              <Field label="Private key" wide>
                <select
                  required
                  value={p.keyId}
                  onChange={(e) => change("keyId", e.target.value)}
                >
                  <option value="">Select local key</option>
                  {keys.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.group || "Personal"} / {k.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        </fieldset>
        <details className="connection-options">
          <summary>Organization and connection options</summary>
          <div className="form-grid">
            <Field label="Group">
              <input
                value={p.group}
                placeholder="Personal"
                onChange={(e) => change("group", e.target.value)}
              />
            </Field>
            <Field label="Tags (comma separated)">
              <input
                value={p.tags?.join(", ") || ""}
                placeholder="production, web"
                onChange={(e) =>
                  change(
                    "tags",
                    e.target.value.split(",").map((s) => s.trim()),
                  )
                }
              />
            </Field>
            <Field label="Jump host" wide>
              <select
                value={p.jumpId}
                onChange={(e) => change("jumpId", e.target.value)}
              >
                <option value="">Direct connection</option>
                {profiles
                  .filter((v) => v.id !== p.id)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Accent color" wide>
              <div className="color-picker">
                {["cyan", "blue", "purple", "orange", "green"].map((color) => (
                  <button
                    type="button"
                    key={color}
                    aria-label={color}
                    className={`color-dot ${color} ${p.color === color ? "selected" : ""}`}
                    onClick={() => change("color", color)}
                  >
                    {p.color === color && <Check size={13} />}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </details>
        <footer>
          <span className="muted">
            <Shield size={13} />
            Encrypted locally
          </span>
          <div className="grow" />
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button disabled={busy} value="save">
            {busy ? "Saving…" : "Save connection"}
          </button>
          <button className="primary" disabled={busy} value="connect">
            Save & connect
          </button>
        </footer>
      </form>
    </Modal>
  );
}
export function KeyForm({
  onSave,
  onClose,
  busy,
  error,
}: {
  onSave: (fields: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  busy: boolean;
  error: (e: unknown) => void;
}) {
  const [type, setType] = useState("ed25519");
  const [path, setPath] = useState("");
  return (
    <Modal
      title="Add SSH key"
      subtitle="Private keys are stored in this device’s OS keychain."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void onSave({
            type,
            path,
            name: f.get("name"),
            passphrase: f.get("passphrase") || "",
            key: { group: f.get("group") },
          });
        }}
      >
        <div className="form-grid">
          <Field label="Key name">
            <input
              name="name"
              required
              autoFocus
              placeholder="Workstation key"
            />
          </Field>
          <Field label="Group">
            <input name="group" defaultValue="Personal" />
          </Field>
          <Field label="Source" wide>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="ed25519">Generate Ed25519 (recommended)</option>
              <option value="rsa">Generate RSA 3072</option>
              <option value="ecdsa">Generate ECDSA P-256</option>
              <option value="import">Import existing private key</option>
            </select>
          </Field>
          {type === "import" && (
            <>
              <Field label="Private-key file" wide>
                <div className="input-with-button">
                  <input
                    required
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                  />
                  <button
                    type="button"
                    title="Browse"
                    onClick={async () => {
                      try {
                        setPath(await chooseFile());
                      } catch (e) {
                        error(e);
                      }
                    }}
                  >
                    <Folder size={16} />
                  </button>
                </div>
              </Field>
              <Field label="Key passphrase (if encrypted)" wide>
                <input name="passphrase" type="password" autoComplete="off" />
              </Field>
            </>
          )}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy
              ? "Storing securely…"
              : type === "import"
                ? "Import key"
                : "Generate key"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
