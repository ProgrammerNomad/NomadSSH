import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { api, Session, Settings } from "./api";

export const terminals = new Map<string, Terminal>();
const pending = new Map<string, Uint8Array[]>();
export function output(id: string, data: string) {
  const decoded = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const terminal = terminals.get(id);
  if (terminal) terminal.write(decoded);
  else {
    const buffer = pending.get(id) || [];
    buffer.push(decoded);
    pending.set(id, buffer);
  }
}
export function clearTerminalState() {
  pending.clear();
  terminals.forEach((t) => t.clear());
}
export default function TerminalPane({
  session,
  visible,
  settings,
  onError,
}: {
  session: Session;
  visible: boolean;
  settings: Settings;
  onError: (e: unknown) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fitRef = useRef<FitAddon>();
  useEffect(() => {
    const t = new Terminal({
      cursorBlink: true,
      fontSize: settings.fontSize,
      fontFamily: "Cascadia Code, Consolas, Menlo, monospace",
      scrollback: settings.scrollback,
      allowProposedApi: false,
      theme: {
        background: "#15191f",
        foreground: "#d2dbe5",
        cursor: "#22d3ee",
        selectionBackground: "#164e63",
        black: "#141b25",
        red: "#f87171",
        green: "#4ade80",
        yellow: "#fbbf24",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#22d3ee",
        white: "#e2e8f0",
      },
    });
    const fit = new FitAddon();
    fitRef.current = fit;
    t.loadAddon(fit);
    t.loadAddon(
      new WebLinksAddon((_e, uri) => {
        void navigator.clipboard
          .writeText(uri)
          .then(() => onError("Link copied to clipboard"))
          .catch(onError);
      }),
    );
    t.open(ref.current!);
    terminals.set(session.id, t);
    t.writeln(
      "\x1b[38;2;34;211;238m  NomadSSH\x1b[0m  ·  " +
        session.name.replace(/[\x00-\x1f\x7f]/g, "") +
        "\r\n",
    );
    for (const data of pending.get(session.id) || []) t.write(data);
    pending.delete(session.id);
    const input = t.onData((data) => {
      void api("write", { id: session.id, data }).catch(onError);
    });
    const resize = t.onResize(({ cols, rows }) => {
      void api("resize", { id: session.id, cols, rows }).catch(onError);
    });
    const observer = new ResizeObserver(() => {
      if (ref.current?.offsetWidth) fit.fit();
    });
    observer.observe(ref.current!);
    return () => {
      observer.disconnect();
      input.dispose();
      resize.dispose();
      terminals.delete(session.id);
      pending.delete(session.id);
      t.dispose();
    };
  }, [session.id]);
  useEffect(() => {
    const t = terminals.get(session.id);
    if (t) {
      t.options.disableStdin = session.status !== "connected";
      t.options.fontSize = settings.fontSize;
      t.options.scrollback = settings.scrollback;
      if (visible) {
        requestAnimationFrame(() => {
          fitRef.current?.fit();
          t.focus();
        });
      }
    }
  }, [visible, settings.fontSize, settings.scrollback, session.status]);
  return (
    <div
      className="terminal-pane"
      style={{ display: visible ? "flex" : "none" }}
    >
      <div className="terminal-meta">
        <span>
          <i className={`dot ${session.status}`} />
          {session.host}
        </span>
        <span>
          {session.serverVersion ||
            (session.local ? "Local shell" : "SSH · xterm-256color")}{" "}
          <b>UTF-8</b>
        </span>
      </div>
      {session.error && <div className="error inline">{session.error}</div>}
      <div className="terminal-canvas" ref={ref} />
      {session.status === "disconnected" && (
        <div className="terminal-ended">
          Session ended. Close this tab or reconnect from Connections.
        </div>
      )}
    </div>
  );
}
