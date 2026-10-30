package core

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/agent"
	"io"
	"net"
	"sync"
	"time"
)

type terminal interface {
	io.ReadWriteCloser
	Resize(int, int) error
}
type SessionInfo struct {
	ID            string `json:"id"`
	ProfileID     string `json:"profileId"`
	Name          string `json:"name"`
	Status        string `json:"status"`
	Started       string `json:"started"`
	Host          string `json:"host"`
	Local         bool   `json:"local"`
	Error         string `json:"error"`
	ServerVersion string `json:"serverVersion"`
}
type Session struct {
	mu        sync.Mutex
	info      SessionInfo
	ctx       context.Context
	cancel    context.CancelFunc
	owner     *Service
	client    *ssh.Client
	shell     *ssh.Session
	input     io.Writer
	local     terminal
	resources []io.Closer
	once      sync.Once
	writeMu   sync.Mutex
}

func (v *Session) Info() SessionInfo { v.mu.Lock(); defer v.mu.Unlock(); return v.info }
func (v *Session) status(status string, err error) {
	v.mu.Lock()
	v.info.Status = status
	if err != nil {
		v.info.Error = err.Error()
	}
	info := v.info
	v.mu.Unlock()
	v.owner.emit(Event{"session", info.ID, info})
}
func (v *Session) Close() {
	v.once.Do(func() {
		v.cancel()
		v.mu.Lock()
		resources := append([]io.Closer{}, v.resources...)
		if v.shell != nil {
			resources = append(resources, v.shell)
		}
		if v.client != nil {
			resources = append(resources, v.client)
		}
		if v.local != nil {
			resources = append(resources, v.local)
		}
		v.input = nil
		v.mu.Unlock()
		for _, c := range resources {
			_ = c.Close()
		}
		info := v.Info()
		if info.Status != "error" {
			v.status("disconnected", nil)
		}
		v.owner.record(info.Name, "connection", "closed", "Session ended")
	})
}
func (v *Session) Write(data string) error {
	if err := v.ctx.Err(); err != nil {
		return err
	}
	if len(data) > 65536 {
		return errors.New("Paste exceeds 64 KiB; split it into smaller pieces")
	}
	v.writeMu.Lock()
	defer v.writeMu.Unlock()
	v.mu.Lock()
	input := v.input
	v.mu.Unlock()
	if input == nil {
		return errors.New("Session is not connected")
	}
	_, err := io.WriteString(input, data)
	return err
}
func (v *Session) Resize(cols, rows int) error {
	if cols < 2 || rows < 2 || cols > 1000 || rows > 1000 {
		return errors.New("Invalid terminal dimensions")
	}
	v.mu.Lock()
	defer v.mu.Unlock()
	if v.shell != nil {
		return v.shell.WindowChange(rows, cols)
	}
	if v.local != nil {
		return v.local.Resize(cols, rows)
	}
	return nil
}
func (s *Service) session(sessionID string) (*Session, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	v := s.sessions[sessionID]
	if v == nil {
		return nil, errors.New("Session not found")
	}
	return v, nil
}
func (s *Service) newSession(profileID, name, host string, local bool) (*Session, error) {
	ctx, cancel := context.WithCancel(context.Background())
	v := &Session{ctx: ctx, cancel: cancel, owner: s, info: SessionInfo{ID: id(), ProfileID: profileID, Name: name, Host: host, Local: local, Status: "connecting", Started: now()}}
	s.mu.Lock()
	if len(s.vault.key) == 0 {
		s.mu.Unlock()
		cancel()
		return nil, errors.New("Vault is locked")
	}
	s.sessions[v.info.ID] = v
	s.mu.Unlock()
	return v, nil
}

type eventWriter struct{ session *Session }

func (w eventWriter) Write(b []byte) (int, error) {
	for start := 0; start < len(b); start += 16384 {
		end := start + 16384
		if end > len(b) {
			end = len(b)
		}
		e := Event{"output", w.session.info.ID, base64.StdEncoding.EncodeToString(b[start:end])}
		select {
		case w.session.owner.events <- e:
		case <-w.session.ctx.Done():
			return start, io.EOF
		}
	}
	return len(b), nil
}
func (s *Service) Connect(profileID string) (SessionInfo, error) {
	p, err := s.profile(profileID)
	if err != nil {
		return SessionInfo{}, err
	}
	v, err := s.newSession(p.ID, p.Name, p.Address(), false)
	if err != nil {
		return SessionInfo{}, err
	}
	go s.runSSH(v, p)
	return v.Info(), nil
}
func (s *Service) runSSH(v *Session, p Profile) {
	client, resources, err := s.dial(v, p, map[string]bool{})
	if err != nil {
		v.status("error", err)
		v.Close()
		return
	}
	v.mu.Lock()
	if v.ctx.Err() != nil {
		v.mu.Unlock()
		client.Close()
		for _, r := range resources {
			r.Close()
		}
		return
	}
	v.client = client
	v.resources = resources
	v.info.ServerVersion = string(client.ServerVersion())
	v.mu.Unlock()
	shell, err := client.NewSession()
	if err != nil {
		v.status("error", err)
		v.Close()
		return
	}
	input, err := shell.StdinPipe()
	if err != nil {
		shell.Close()
		v.status("error", err)
		v.Close()
		return
	}
	shell.Stdout = eventWriter{v}
	shell.Stderr = eventWriter{v}
	v.mu.Lock()
	if v.ctx.Err() != nil {
		v.mu.Unlock()
		shell.Close()
		return
	}
	v.shell = shell
	v.input = input
	v.mu.Unlock()
	if err = shell.RequestPty("xterm-256color", 30, 120, ssh.TerminalModes{ssh.ECHO: 1, ssh.TTY_OP_ISPEED: 14400, ssh.TTY_OP_OSPEED: 14400}); err == nil {
		err = shell.Shell()
	}
	if err != nil {
		v.status("error", err)
		v.Close()
		return
	}
	v.status("connected", nil)
	s.record(p.Name, "connection", "connected", p.Address())
	_ = s.mutate(func(d *Data) error {
		for i := range d.Profiles {
			if d.Profiles[i].ID == p.ID {
				d.Profiles[i].LastConnected = now()
			}
		}
		return nil
	})
	go func() {
		tick := time.NewTicker(20 * time.Second)
		defer tick.Stop()
		for {
			select {
			case <-v.ctx.Done():
				return
			case <-tick.C:
				_, _, err := client.SendRequest("keepalive@openssh.com", true, nil)
				if err != nil {
					v.Close()
					return
				}
			}
		}
	}()
	_ = shell.Wait()
	v.Close()
}
func (s *Service) dial(v *Session, p Profile, seen map[string]bool) (*ssh.Client, []io.Closer, error) {
	if seen[p.ID] || len(seen) > 5 {
		return nil, nil, errors.New("Jump-host cycle or chain longer than five hosts")
	}
	seen[p.ID] = true
	resources := []io.Closer{}
	fail := func(err error) (*ssh.Client, []io.Closer, error) {
		for _, r := range resources {
			r.Close()
		}
		return nil, nil, err
	}
	config := &ssh.ClientConfig{User: p.Username, Timeout: 20 * time.Second, HostKeyCallback: func(host string, remote net.Addr, key ssh.PublicKey) error { return s.verifyHost(v, p, key) }}
	switch p.Auth {
	case "password":
		if p.Password == "" {
			return fail(errors.New("Edit this profile and enter its password"))
		}
		config.Auth = []ssh.AuthMethod{ssh.Password(p.Password)}
	case "key":
		s.mu.Lock()
		if len(s.vault.key) == 0 {
			s.mu.Unlock()
			return fail(errors.New("Vault is locked"))
		}
		raw, err := s.secrets.Get(p.KeyID)
		s.mu.Unlock()
		if err != nil {
			return fail(err)
		}
		signer, err := ssh.ParsePrivateKey([]byte(raw))
		if err != nil {
			return fail(err)
		}
		config.Auth = []ssh.AuthMethod{ssh.PublicKeys(signer)}
	case "agent":
		conn, err := dialAgent(v.ctx)
		if err != nil {
			return fail(err)
		}
		resources = append(resources, conn)
		config.Auth = []ssh.AuthMethod{ssh.PublicKeysCallback(agent.NewClient(conn).Signers)}
	default:
		return fail(errors.New("Unsupported authentication method"))
	}
	var conn net.Conn
	var err error
	if p.JumpID != "" {
		jump, err := s.profile(p.JumpID)
		if err != nil {
			return fail(err)
		}
		jc, jr, err := s.dial(v, jump, seen)
		if err != nil {
			return fail(err)
		}
		resources = append(resources, jr...)
		resources = append(resources, jc)
		conn, err = jc.DialContext(v.ctx, "tcp", p.Address())
		if err != nil {
			return fail(err)
		}
	} else {
		conn, err = (&net.Dialer{Timeout: 20 * time.Second}).DialContext(v.ctx, "tcp", p.Address())
		if err != nil {
			return fail(err)
		}
	}
	stop := context.AfterFunc(v.ctx, func() { conn.Close() })
	defer stop()
	_ = conn.SetDeadline(time.Now().Add(90 * time.Second))
	cc, ch, req, err := ssh.NewClientConn(conn, p.Address(), config)
	if err != nil {
		conn.Close()
		return fail(err)
	}
	_ = conn.SetDeadline(time.Time{})
	return ssh.NewClient(cc, ch, req), resources, nil
}
func (s *Service) verifyHost(v *Session, p Profile, key ssh.PublicKey) error {
	fingerprint := ssh.FingerprintSHA256(key)
	s.mu.Lock()
	if len(s.vault.key) == 0 {
		s.mu.Unlock()
		return errors.New("Vault is locked")
	}
	old := ""
	for _, h := range s.vault.data.Hosts {
		if h.Host == p.Address() {
			old = h.Fingerprint
			break
		}
	}
	if old == fingerprint {
		s.mu.Unlock()
		return nil
	}
	promptID := id()
	reply := make(chan bool, 1)
	s.prompts[promptID] = reply
	s.mu.Unlock()
	defer func() {
		s.mu.Lock()
		delete(s.prompts, promptID)
		s.mu.Unlock()
		s.emit(Event{Kind: "hostKeyDone", ID: promptID})
	}()
	s.emit(Event{"hostKey", promptID, map[string]any{"host": p.Address(), "fingerprint": fingerprint, "oldFingerprint": old, "type": key.Type(), "sessionId": v.info.ID}})
	timer := time.NewTimer(60 * time.Second)
	defer timer.Stop()
	select {
	case accept := <-reply:
		if !accept {
			return errors.New("Host key was rejected")
		}
	case <-v.ctx.Done():
		return v.ctx.Err()
	case <-timer.C:
		return errors.New("Host-key confirmation timed out")
	}
	return s.mutate(func(d *Data) error {
		host := KnownHost{p.Address(), fingerprint, key.Type(), now()}
		for i, h := range d.Hosts {
			if h.Host == host.Host {
				d.Hosts[i] = host
				return nil
			}
		}
		d.Hosts = append(d.Hosts, host)
		return nil
	})
}
func (s *Service) Local() (SessionInfo, error) {
	v, err := s.newSession("", "Local terminal", "This computer", true)
	if err != nil {
		return SessionInfo{}, err
	}
	go func() {
		t, err := startTerminal()
		if err != nil {
			v.status("error", err)
			v.Close()
			return
		}
		v.mu.Lock()
		if v.ctx.Err() != nil {
			v.mu.Unlock()
			t.Close()
			return
		}
		v.local = t
		v.input = t
		v.mu.Unlock()
		v.status("connected", nil)
		_, err = io.Copy(eventWriter{v}, t)
		if err != nil && v.ctx.Err() == nil {
			_ = fmt.Sprint(err)
		}
		v.Close()
	}()
	return v.Info(), nil
}
