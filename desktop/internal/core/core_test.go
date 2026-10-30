package core

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"golang.org/x/crypto/ssh"
	"golang.org/x/net/proxy"
	"io"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

type memorySecrets map[string]string

func (m memorySecrets) Set(k, v string) error { m[k] = v; return nil }
func (m memorySecrets) Get(k string) (string, error) {
	v, ok := m[k]
	if !ok {
		return "", errors.New("missing local secret")
	}
	return v, nil
}
func (m memorySecrets) Delete(k string) error { delete(m, k); return nil }

const testPassword = "test master password 27!"

func newTestService(t *testing.T) *Service {
	t.Helper()
	s, e := New(t.TempDir())
	if e != nil {
		t.Fatal(e)
	}
	s.secrets = memorySecrets{}
	if e = s.vault.create(testPassword); e != nil {
		t.Fatal(e)
	}
	t.Cleanup(s.Close)
	return s
}
func must(t *testing.T, e error) {
	t.Helper()
	if e != nil {
		t.Fatal(e)
	}
}
func eventually(t *testing.T, fn func() bool) {
	t.Helper()
	until := time.Now().Add(8 * time.Second)
	for time.Now().Before(until) {
		if fn() {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("condition timed out")
}

func TestVaultAuthenticationPersistenceAndRotation(t *testing.T) {
	s := newTestService(t)
	p, e := s.saveProfile(Profile{Name: "Private server", Host: "example.test", Port: 22, Username: "alice", Auth: "password", Password: "server-secret"})
	must(t, e)
	raw, e := os.ReadFile(s.vault.path)
	must(t, e)
	if bytes.Contains(raw, []byte("server-secret")) || bytes.Contains(raw, []byte("example.test")) {
		t.Fatal("plaintext in vault")
	}
	state, e := s.Invoke(`{"op":"state"}`)
	must(t, e)
	if strings.Contains(state, "server-secret") {
		t.Fatal("password exposed to renderer")
	}
	must(t, s.vault.changePassword(testPassword, "replacement master password"))
	s.Lock()
	if e = s.vault.unlock(testPassword); e == nil {
		t.Fatal("old password still works")
	}
	must(t, s.vault.unlock("replacement master password"))
	restored, e := s.profile(p.ID)
	must(t, e)
	if restored.Password != "server-secret" {
		t.Fatal("lost credentials")
	}
	raw, e = os.ReadFile(s.vault.path)
	must(t, e)
	var env envelope
	must(t, json.Unmarshal(raw, &env))
	env.Ciphertext[len(env.Ciphertext)/2] ^= 1
	raw, _ = json.Marshal(env)
	must(t, os.WriteFile(s.vault.path, raw, 0600))
	s.Lock()
	if s.vault.unlock("replacement master password") == nil {
		t.Fatal("tampered vault accepted")
	}
}

func TestKeysNeverEnterBackupAndMissingKeysStayMissing(t *testing.T) {
	s := newTestService(t)
	k, e := s.addKey(Request{Op: "generateKey", Name: "Test identity", Type: "ed25519"})
	must(t, e)
	raw, e := s.secrets.Get(k.ID)
	must(t, e)
	signer, e := ssh.ParsePrivateKey([]byte(raw))
	must(t, e)
	if ssh.FingerprintSHA256(signer.PublicKey()) != k.Fingerprint {
		t.Fatal("wrong fingerprint")
	}
	path := filepath.Join(t.TempDir(), "backup.json")
	must(t, s.exportMetadata(path))
	v := vault{path: path}
	must(t, v.unlock(testPassword))
	defer v.lock()
	plain, _ := json.Marshal(v.data)
	if bytes.Contains(plain, []byte("PRIVATE KEY")) || bytes.Contains(plain, []byte(raw)) {
		t.Fatal("private key exported")
	}
	target := newTestService(t)
	must(t, target.restoreMetadata(path, testPassword))
	if len(target.vault.data.Keys) != 1 {
		t.Fatal("missing key metadata")
	}
	if _, e = target.secrets.Get(k.ID); e == nil {
		t.Fatal("private key crossed devices")
	}
	target.Lock()
	if _, e = target.Invoke(`{"op":"generateKey","name":"blocked","type":"ed25519"}`); e == nil {
		t.Fatal("locked API permitted key creation")
	}
}

func connectedSandbox(t *testing.T) (*Service, *Sandbox, *Session, Profile) {
	t.Helper()
	s := newTestService(t)
	sb, e := NewSandbox()
	must(t, e)
	t.Cleanup(func() { sb.Close(); _ = os.RemoveAll(sb.Root) })
	p, e := s.saveProfile(Profile{Name: "Loopback test", Host: "127.0.0.1", Port: sb.Listener.Addr().(*net.TCPAddr).Port, Username: "demo", Auth: "password", Password: sb.Password})
	must(t, e)
	info, e := s.Connect(p.ID)
	must(t, e)
	session, e := s.session(info.ID)
	must(t, e)
	eventually(t, func() bool {
		select {
		case event := <-s.controlEvents:
			if event.Kind == "hostKey" {
				data := event.Data.(map[string]any)
				if data["fingerprint"] != ssh.FingerprintSHA256(sb.Signer.PublicKey()) {
					t.Fatal("incorrect host fingerprint")
				}
				_, e = s.dispatch(Request{Op: "trust", ID: event.ID, Accepted: true})
				must(t, e)
			}
		default:
		}
		return session.Info().Status == "connected"
	})
	return s, sb, session, p
}

func TestSSHOutputHostTrustAndLockCleanup(t *testing.T) {
	s, sb, session, p := connectedSandbox(t)
	if !s.HasLiveWork() {
		t.Fatal("connected session must trigger the exit confirmation")
	}
	must(t, session.Resize(90, 27))
	must(t, session.Write("echo verified-世界\r"))
	var output bytes.Buffer
	eventually(t, func() bool {
		select {
		case event := <-s.events:
			if event.Kind == "output" {
				b, e := base64.StdEncoding.DecodeString(event.Data.(string))
				must(t, e)
				output.Write(b)
			}
		default:
		}
		return strings.Contains(output.String(), "verified-世界\r\n")
	})
	// A changed key must ask again and rejection must preserve the trusted key.
	other, e := generatePrivateKey("ed25519")
	must(t, e)
	otherSigner, e := ssh.NewSignerFromKey(other)
	must(t, e)
	result := make(chan error, 1)
	go func() { result <- s.verifyHost(session, p, otherSigner.PublicKey()) }()
	eventually(t, func() bool {
		select {
		case event := <-s.controlEvents:
			if event.Kind == "hostKey" {
				if event.Data.(map[string]any)["oldFingerprint"] != ssh.FingerprintSHA256(sb.Signer.PublicKey()) {
					t.Fatal("missing changed-key warning")
				}
				_, e = s.dispatch(Request{Op: "trust", ID: event.ID, Accepted: false})
				must(t, e)
				return true
			}
		default:
		}
		return false
	})
	if e = <-result; e == nil {
		t.Fatal("changed host accepted")
	}
	s.Lock()
	if s.HasLiveWork() {
		t.Fatal("locked workspace must have no live work")
	}
	if len(s.sessions) != 0 {
		t.Fatal("sessions retained after lock")
	}
	if session.ctx.Err() == nil {
		t.Fatal("session not cancelled")
	}
	if strings.Contains(s.Poll(), "output") {
		t.Fatal("terminal bytes exposed while locked")
	}
}

func waitTransfer(t *testing.T, s *Service, info TransferInfo) TransferInfo {
	t.Helper()
	var done TransferInfo
	eventually(t, func() bool {
		s.mu.Lock()
		tr := s.transfers[info.ID]
		s.mu.Unlock()
		done = tr.Info()
		return done.Status == "completed" || done.Status == "error" || done.Status == "cancelled"
	})
	return done
}
func TestSFTPRoundTripAndOverwriteProtection(t *testing.T) {
	s, _, session, _ := connectedSandbox(t)
	dir := t.TempDir()
	input := filepath.Join(dir, "source.bin")
	content := bytes.Repeat([]byte("binary\x00🌍\xff\n"), 30000)
	must(t, os.WriteFile(input, content, 0600))
	root, e := s.listFiles(Request{ID: session.info.ID, Remote: true})
	must(t, e)
	remote := strings.TrimSuffix(root.Path, "/") + "/uploads/roundtrip.bin"
	up, e := s.startTransfer(Request{ID: session.info.ID, Path: input, Destination: remote})
	must(t, e)
	if done := waitTransfer(t, s, up); done.Status != "completed" {
		t.Fatal(done)
	}
	listing, e := s.listFiles(Request{ID: session.info.ID, Remote: true, Path: strings.TrimSuffix(root.Path, "/") + "/uploads"})
	must(t, e)
	if len(listing.Files) != 1 {
		t.Fatal(listing)
	}
	target := filepath.Join(dir, "download.bin")
	down, e := s.startTransfer(Request{ID: session.info.ID, Remote: true, Path: remote, Destination: target})
	must(t, e)
	if done := waitTransfer(t, s, down); done.Status != "completed" {
		t.Fatal(done)
	}
	actual, e := os.ReadFile(target)
	must(t, e)
	if !bytes.Equal(actual, content) {
		t.Fatal("transfer corrupted bytes")
	}
	again, e := s.startTransfer(Request{ID: session.info.ID, Remote: true, Path: remote, Destination: target})
	must(t, e)
	if done := waitTransfer(t, s, again); done.Status != "error" {
		t.Fatal("existing file overwritten")
	}
	must(t, s.fileAction(Request{ID: session.info.ID, Remote: true, Type: "rename", Path: remote, Destination: remote + ".renamed"}))
	must(t, s.fileAction(Request{ID: session.info.ID, Remote: true, Type: "delete", Path: remote + ".renamed"}))
}

func freeAddress(t *testing.T) string {
	t.Helper()
	ln, e := net.Listen("tcp", "127.0.0.1:0")
	must(t, e)
	addr := ln.Addr().String()
	ln.Close()
	return addr
}
func TestLocalAndSOCKSForwardingCleanup(t *testing.T) {
	s, _, session, p := connectedSandbox(t)
	echo, e := net.Listen("tcp", "127.0.0.1:0")
	must(t, e)
	defer echo.Close()
	go func() {
		for {
			c, e := echo.Accept()
			if e != nil {
				return
			}
			go func() { defer c.Close(); _, _ = io.Copy(c, c) }()
		}
	}()
	for _, kind := range []string{"local", "dynamic", "remote"} {
		t.Run(kind, func(t *testing.T) {
			tun := Tunnel{ID: id(), Name: kind, ProfileID: p.ID, Type: kind, Bind: freeAddress(t), Destination: echo.Addr().String()}
			must(t, s.mutate(func(d *Data) error { d.Tunnels = append(d.Tunnels, tun); return nil }))
			must(t, s.startTunnel(tun.ID))
			var c net.Conn
			if kind == "dynamic" {
				dialer, e := proxy.SOCKS5("tcp", tun.Bind, nil, &net.Dialer{Timeout: 3 * time.Second})
				must(t, e)
				c, e = dialer.Dial("tcp", echo.Addr().String())
				must(t, e)
			} else {
				c, e = net.DialTimeout("tcp", tun.Bind, 3*time.Second)
				must(t, e)
			}
			c.SetDeadline(time.Now().Add(3 * time.Second))
			_, e = c.Write([]byte("forwarded"))
			must(t, e)
			b := make([]byte, 9)
			_, e = io.ReadFull(c, b)
			must(t, e)
			if string(b) != "forwarded" {
				t.Fatal("tunnel corruption")
			}
			c.Close()
			s.stopTunnel(tun.ID)
			ln, e := net.Listen("tcp", tun.Bind)
			must(t, e)
			ln.Close()
		})
	}
	session.Close()
}

func TestLocalTerminalLifecycle(t *testing.T) {
	s := newTestService(t)
	info, e := s.Local()
	must(t, e)
	session, e := s.session(info.ID)
	must(t, e)
	eventually(t, func() bool { return session.Info().Status == "connected" || session.Info().Status == "error" })
	if session.Info().Status == "error" {
		t.Fatal(session.Info().Error)
	}
	must(t, session.Write("echo NOMAD_PTY_OK\r\n"))
	var output strings.Builder
	eventually(t, func() bool {
		select {
		case event := <-s.events:
			if event.Kind == "output" {
				b, _ := base64.StdEncoding.DecodeString(event.Data.(string))
				output.Write(b)
			}
		default:
		}
		return strings.Contains(output.String(), "NOMAD_PTY_OK")
	})
	must(t, session.Resize(100, 30))
	session.Close()
	if session.ctx.Err() == nil {
		t.Fatal("local terminal still active")
	}
}

func TestDriveConfigAndLockedGuard(t *testing.T) {
	s := newTestService(t)
	if s.configureDrive(Request{ClientID: "invalid"}) == nil {
		t.Fatal("invalid OAuth ID accepted")
	}
	must(t, s.configureDrive(Request{ClientID: "test.apps.googleusercontent.com", ClientSecret: "local-secret", AutoSync: true}))
	raw, e := os.ReadFile(s.driveConfigPath())
	must(t, e)
	if bytes.Contains(raw, []byte("local-secret")) {
		t.Fatal("OAuth secret written in plaintext")
	}
	if _, e = s.uploadDrive(); e == nil {
		t.Fatal("upload succeeded without OAuth token")
	}
	s.Lock()
	if _, e = s.BeginDriveAuth(); e == nil {
		t.Fatal("OAuth allowed while locked")
	}
}

func TestRecursiveTransferAndVerifiedResume(t *testing.T) {
	s, _, session, _ := connectedSandbox(t)
	root, e := s.listFiles(Request{ID: session.info.ID, Remote: true})
	must(t, e)
	source := filepath.Join(t.TempDir(), "tree")
	must(t, os.MkdirAll(filepath.Join(source, "nested", "empty"), 0700))
	content := bytes.Repeat([]byte("resume-validated\x00"), 65536)
	must(t, os.WriteFile(filepath.Join(source, "nested", "large.bin"), content, 0600))
	destination := root.Path + "/uploads/tree"
	up, e := s.startTransfer(Request{ID: session.info.ID, Path: source, Destination: destination})
	must(t, e)
	if done := waitTransfer(t, s, up); done.Status != "completed" {
		t.Fatal(done)
	}
	target := filepath.Join(t.TempDir(), "restored")
	must(t, os.MkdirAll(filepath.Join(target, "nested"), 0700))
	file := filepath.Join(target, "nested", "large.bin")
	must(t, os.WriteFile(file, content[:12345], 0600))
	down, e := s.startTransfer(Request{ID: session.info.ID, Remote: true, Path: destination, Destination: target, Mode: "resume"})
	must(t, e)
	if done := waitTransfer(t, s, down); done.Status != "completed" {
		t.Fatal(done)
	}
	actual, e := os.ReadFile(file)
	must(t, e)
	if !bytes.Equal(actual, content) {
		t.Fatal("resumed file differs")
	}
	_, e = os.Stat(filepath.Join(target, "nested", "empty"))
	must(t, e)
	must(t, os.WriteFile(file, []byte("wrong partial content"), 0600))
	bad, e := s.startTransfer(Request{ID: session.info.ID, Remote: true, Path: destination, Destination: target, Mode: "resume"})
	must(t, e)
	if done := waitTransfer(t, s, bad); done.Status != "error" || !strings.Contains(done.Error, "resume refused") {
		t.Fatal(done)
	}
}

func TestEncryptedPrivateKeyAuthenticationAndJumpHost(t *testing.T) {
	s, sb, _, p := connectedSandbox(t)
	private, e := generatePrivateKey("ed25519")
	must(t, e)
	signer, e := ssh.NewSignerFromKey(private)
	must(t, e)
	sb.mu.Lock()
	sb.AuthorizedKeys = append(sb.AuthorizedKeys, signer.PublicKey())
	sb.mu.Unlock()
	block, e := ssh.MarshalPrivateKeyWithPassphrase(private, "test", []byte("key passphrase"))
	must(t, e)
	file := filepath.Join(t.TempDir(), "id_ed25519")
	must(t, os.WriteFile(file, pem.EncodeToMemory(block), 0600))
	if _, e = s.addKey(Request{Op: "importKey", Name: "Wrong passphrase", Path: file, Passphrase: "incorrect"}); e == nil {
		t.Fatal("wrong passphrase accepted")
	}
	key, e := s.addKey(Request{Op: "importKey", Name: "Imported identity", Path: file, Passphrase: "key passphrase"})
	must(t, e)
	target := p
	target.ID = ""
	target.Name = "Through bastion"
	target.Auth = "key"
	target.KeyID = key.ID
	target.Password = ""
	target.JumpID = p.ID
	target, e = s.saveProfile(target)
	must(t, e)
	info, e := s.Connect(target.ID)
	must(t, e)
	session, e := s.session(info.ID)
	must(t, e)
	eventually(t, func() bool { return session.Info().Status == "connected" || session.Info().Status == "error" })
	if session.Info().Status != "connected" {
		t.Fatal(session.Info())
	}
	session.Close()
}

func TestLockWhileTerminalOutputIsBackpressured(t *testing.T) {
	s := newTestService(t)
	session, e := s.newSession("", "Test output", "loopback", false)
	must(t, e)
	result := make(chan error, 1)
	go func() { _, err := (eventWriter{session}).Write(make([]byte, 8<<20)); result <- err }()
	eventually(t, func() bool { return len(s.events) == cap(s.events) })
	done := make(chan struct{})
	go func() { s.Lock(); close(done) }()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("lock blocked behind terminal output")
	}
	select {
	case err := <-result:
		if err == nil {
			t.Fatal("output was not cancelled")
		}
	case <-time.After(time.Second):
		t.Fatal("output writer leaked")
	}
	if _, e = s.Local(); e == nil {
		t.Fatal("created a local terminal while locked")
	}
	if strings.Contains(s.Poll(), "output") {
		t.Fatal("output delivered while locked")
	}
}

func TestWorkspaceLockReleasedOnClose(t *testing.T) {
	directory := t.TempDir()
	first, e := New(directory)
	must(t, e)
	defer first.Close()
	if second, e := New(directory); e == nil {
		second.Close()
		t.Fatal("second instance opened the same workspace")
	}
	first.Close()
	second, e := New(directory)
	must(t, e)
	second.Close()
}
