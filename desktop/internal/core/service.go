package core

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"golang.org/x/crypto/ssh"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type Event struct {
	Kind string `json:"kind"`
	ID   string `json:"id"`
	Data any    `json:"data"`
}
type Service struct {
	workspaceLock io.Closer
	closeOnce     sync.Once
	driveMu       sync.Mutex
	demo          bool
	mu            sync.Mutex
	vault         vault
	secrets       secretStore
	sessions      map[string]*Session
	prompts       map[string]chan bool
	events        chan Event
	controlEvents chan Event
	forwards      map[string]*Forward
	transfers     map[string]*Transfer
	lastActivity  time.Time
	stop          chan struct{}
}
type Request struct {
	ClientID     string   `json:"clientId"`
	ClientSecret string   `json:"clientSecret"`
	AutoSync     bool     `json:"autoSync"`
	Op           string   `json:"op"`
	ID           string   `json:"id"`
	Password     string   `json:"password"`
	NewPassword  string   `json:"newPassword"`
	Profile      Profile  `json:"profile"`
	Key          Key      `json:"key"`
	Path         string   `json:"path"`
	Destination  string   `json:"destination"`
	Name         string   `json:"name"`
	Type         string   `json:"type"`
	Passphrase   string   `json:"passphrase"`
	Accepted     bool     `json:"accepted"`
	Data         string   `json:"data"`
	Cols         int      `json:"cols"`
	Rows         int      `json:"rows"`
	Remote       bool     `json:"remote"`
	Mode         string   `json:"mode"`
	Snippet      Snippet  `json:"snippet"`
	Tunnel       Tunnel   `json:"tunnel"`
	Settings     Settings `json:"settings"`
}

func New(directory string) (*Service, error) {
	if directory == "" {
		root, err := os.UserConfigDir()
		if err != nil {
			return nil, err
		}
		directory = filepath.Join(root, "NomadSSH-Go")
	}
	if err := os.MkdirAll(directory, 0700); err != nil {
		return nil, err
	}
	directory, err := filepath.Abs(directory)
	if err != nil {
		return nil, err
	}
	if resolved, e := filepath.EvalSymlinks(directory); e == nil {
		directory = resolved
	}
	workspaceLock, err := lockWorkspace(filepath.Join(directory, ".instance.lock"))
	if err != nil {
		return nil, err
	}
	sum := sha256.Sum256([]byte(directory))
	s := &Service{workspaceLock: workspaceLock, vault: vault{path: filepath.Join(directory, "vault.json")}, secrets: systemSecrets{namespace: "NomadSSH-" + hex.EncodeToString(sum[:8])}, sessions: map[string]*Session{}, prompts: map[string]chan bool{}, events: make(chan Event, 256), controlEvents: make(chan Event, 256), forwards: map[string]*Forward{}, transfers: map[string]*Transfer{}, lastActivity: time.Now(), stop: make(chan struct{})}
	go s.idleLoop()
	go s.autoSyncLoop()
	return s, nil
}
func (s *Service) idleLoop() {
	t := time.NewTicker(15 * time.Second)
	defer t.Stop()
	for {
		select {
		case <-s.stop:
			return
		case <-t.C:
			s.mu.Lock()
			idle := len(s.vault.key) > 0 && s.vault.data.Settings.IdleMinutes > 0 && time.Since(s.lastActivity) > time.Duration(s.vault.data.Settings.IdleMinutes)*time.Minute
			s.mu.Unlock()
			if idle {
				s.Lock()
			}
		}
	}
}
func (s *Service) Close() {
	s.closeOnce.Do(func() {
		close(s.stop)
		s.Lock()
		if s.workspaceLock != nil {
			_ = s.workspaceLock.Close()
		}
	})
}
func (s *Service) Lock() {
	s.mu.Lock()
	sessions := make([]*Session, 0, len(s.sessions))
	for _, v := range s.sessions {
		sessions = append(sessions, v)
	}
	for _, p := range s.prompts {
		select {
		case p <- false:
		default:
		}
	}
	s.vault.lock()
	s.sessions = map[string]*Session{}
	s.transfers = map[string]*Transfer{}
	s.mu.Unlock()
	for _, v := range sessions {
		v.Close()
	}
	s.emit(Event{Kind: "locked"})
}
func (s *Service) emit(e Event) {
	// Terminal output has its own bounded channel and cancellation-aware writer.
	// Control events remain deliverable when output backpressure fills that channel.
	select {
	case s.controlEvents <- e:
	case <-s.stop:
	}
}
func (s *Service) Poll() string {
	events := []Event{}
	appendEvent := func(e Event) {
		s.mu.Lock()
		locked := len(s.vault.key) == 0
		_, present := s.sessions[e.ID]
		s.mu.Unlock()
		if locked && e.Kind != "locked" {
			return
		}
		if e.Kind == "output" && !present {
			return
		}
		events = append(events, e)
	}
	for len(events) < 128 {
		select {
		case e := <-s.controlEvents:
			appendEvent(e)
			continue
		default:
		}
		select {
		case e := <-s.events:
			appendEvent(e)
		default:
			b, _ := json.Marshal(events)
			return string(b)
		}
	}
	b, _ := json.Marshal(events)
	return string(b)
}
func (s *Service) Invoke(raw string) (string, error) {
	if len(raw) > 2<<20 {
		return "", errors.New("Request too large")
	}
	var r Request
	if err := json.Unmarshal([]byte(raw), &r); err != nil {
		return "", errors.New("Invalid request")
	}
	s.mu.Lock()
	unlocked := len(s.vault.key) > 0
	if r.Op != "state" && r.Op != "poll" {
		s.lastActivity = time.Now()
	}
	s.mu.Unlock()
	if !unlocked && r.Op != "state" && r.Op != "createVault" && r.Op != "unlock" {
		return "", errors.New("Unlock your vault first")
	}
	result, err := s.dispatch(r)
	if err != nil {
		return "", err
	}
	out, err := json.Marshal(result)
	return string(out), err
}
func (s *Service) dispatch(r Request) (any, error) {
	switch r.Op {
	case "driveStatus":
		return s.driveStatus()
	case "driveConfigure":
		return true, s.configureDrive(r)
	case "driveUpload":
		return s.uploadDrive()
	case "driveList":
		return s.listDrive()
	case "driveRestore":
		return true, s.restoreDrive(r.ID, r.Password)
	case "state":
		return s.State(), nil
	case "activity":
		return true, nil
	case "createVault", "unlock":
		s.mu.Lock()
		defer s.mu.Unlock()
		if len(s.vault.key) > 0 {
			return nil, errors.New("Vault is already unlocked")
		}
		var err error
		if r.Op == "createVault" {
			err = s.vault.create(r.Password)
		} else {
			err = s.vault.unlock(r.Password)
		}
		return true, err
	case "lock":
		s.Lock()
		return true, nil
	case "changePassword":
		s.mu.Lock()
		defer s.mu.Unlock()
		return true, s.vault.changePassword(r.Password, r.NewPassword)
	case "saveProfile":
		return s.saveProfile(r.Profile)
	case "deleteProfile":
		return true, s.mutate(func(d *Data) error {
			for i, p := range d.Profiles {
				if p.ID == r.ID {
					d.Profiles = append(d.Profiles[:i], d.Profiles[i+1:]...)
					return nil
				}
			}
			return errors.New("Profile not found")
		})
	case "connect":
		return s.Connect(r.ID)
	case "local":
		return s.Local()
	case "disconnect":
		session, err := s.session(r.ID)
		if err != nil {
			return nil, err
		}
		session.Close()
		s.mu.Lock()
		delete(s.sessions, r.ID)
		s.mu.Unlock()
		return true, nil
	case "write":
		session, err := s.session(r.ID)
		if err != nil {
			return nil, err
		}
		return true, session.Write(r.Data)
	case "resize":
		session, err := s.session(r.ID)
		if err != nil {
			return nil, err
		}
		return true, session.Resize(r.Cols, r.Rows)
	case "trust":
		s.mu.Lock()
		prompt := s.prompts[r.ID]
		s.mu.Unlock()
		if prompt == nil {
			return nil, errors.New("Verification request expired")
		}
		select {
		case prompt <- r.Accepted:
		default:
			return nil, errors.New("Verification already answered")
		}
		return true, nil
	case "forgetHost":
		return true, s.mutate(func(d *Data) error {
			for i, h := range d.Hosts {
				if h.Host == r.ID {
					d.Hosts = append(d.Hosts[:i], d.Hosts[i+1:]...)
					break
				}
			}
			return nil
		})
	case "importKey", "generateKey":
		return s.addKey(r)
	case "deleteKey":
		s.mu.Lock()
		defer s.mu.Unlock()
		for _, p := range s.vault.data.Profiles {
			if p.KeyID == r.ID {
				return nil, errors.New("This key is used by a profile; change that profile first")
			}
		}
		for i, k := range s.vault.data.Keys {
			if k.ID == r.ID {
				if err := s.secrets.Delete(k.ID); err != nil {
					return nil, err
				}
				s.vault.data.Keys = append(s.vault.data.Keys[:i], s.vault.data.Keys[i+1:]...)
				return true, s.vault.save()
			}
		}
		return nil, errors.New("Key not found")
	case "saveSnippet":
		return true, s.mutate(func(d *Data) error {
			if strings.TrimSpace(r.Snippet.Name) == "" || r.Snippet.Command == "" {
				return errors.New("Name and command are required")
			}
			if r.Snippet.ID == "" {
				r.Snippet.ID = id()
			}
			for i, v := range d.Snippets {
				if v.ID == r.Snippet.ID {
					d.Snippets[i] = r.Snippet
					return nil
				}
			}
			d.Snippets = append(d.Snippets, r.Snippet)
			return nil
		})
	case "deleteSnippet":
		return true, s.mutate(func(d *Data) error {
			for i, v := range d.Snippets {
				if v.ID == r.ID {
					d.Snippets = append(d.Snippets[:i], d.Snippets[i+1:]...)
					break
				}
			}
			return nil
		})
	case "settings":
		return true, s.mutate(func(d *Data) error {
			if r.Settings.FontSize < 10 || r.Settings.FontSize > 28 || r.Settings.Scrollback < 100 || r.Settings.Scrollback > 100000 || r.Settings.IdleMinutes < 1 || r.Settings.IdleMinutes > 120 {
				return errors.New("Settings are outside the supported range")
			}
			d.Settings = r.Settings
			return nil
		})
	case "listFiles":
		return s.listFiles(r)
	case "fileAction":
		return true, s.fileAction(r)
	case "transfer":
		return s.startTransfer(r)
	case "cancelTransfer", "pauseTransfer", "resumeTransfer":
		return s.controlTransfer(r)
	case "saveTunnel":
		return true, s.mutate(func(d *Data) error {
			if err := validateTunnel(r.Tunnel); err != nil {
				return err
			}
			if r.Tunnel.ID == "" {
				r.Tunnel.ID = id()
			}
			for i, t := range d.Tunnels {
				if t.ID == r.Tunnel.ID {
					d.Tunnels[i] = r.Tunnel
					return nil
				}
			}
			d.Tunnels = append(d.Tunnels, r.Tunnel)
			return nil
		})
	case "deleteTunnel":
		s.stopTunnel(r.ID)
		return true, s.mutate(func(d *Data) error {
			for i, t := range d.Tunnels {
				if t.ID == r.ID {
					d.Tunnels = append(d.Tunnels[:i], d.Tunnels[i+1:]...)
					break
				}
			}
			return nil
		})
	case "startTunnel":
		return true, s.startTunnel(r.ID)
	case "stopTunnel":
		s.stopTunnel(r.ID)
		return true, nil
	case "export":
		return true, s.exportMetadata(r.Path)
	case "restore":
		return true, s.restoreMetadata(r.Path, r.Password)
	default:
		return nil, fmt.Errorf("Unknown operation: %s", r.Op)
	}
}
func (s *Service) mutate(fn func(*Data) error) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.vault.key) == 0 {
		return errors.New("Vault is locked")
	}
	before, _ := json.Marshal(s.vault.data)
	if err := fn(&s.vault.data); err != nil {
		_ = json.Unmarshal(before, &s.vault.data)
		return err
	}
	if err := s.vault.save(); err != nil {
		_ = json.Unmarshal(before, &s.vault.data)
		return err
	}
	return nil
}
func (s *Service) saveProfile(p Profile) (Profile, error) {
	if err := p.Validate(); err != nil {
		return p, err
	}
	if p.ID == "" {
		p.ID = id()
	}
	err := s.mutate(func(d *Data) error {
		if p.JumpID == p.ID {
			return errors.New("A profile cannot jump through itself")
		}
		for i, old := range d.Profiles {
			if old.ID == p.ID {
				if p.Password == "" {
					p.Password = old.Password
				}
				d.Profiles[i] = p
				return nil
			}
		}
		d.Profiles = append(d.Profiles, p)
		return nil
	})
	p.Password = ""
	return p, err
}
func (s *Service) profile(profileID string) (Profile, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.vault.key) == 0 {
		return Profile{}, errors.New("Vault is locked")
	}
	for _, p := range s.vault.data.Profiles {
		if p.ID == profileID {
			return p, nil
		}
	}
	return Profile{}, errors.New("Profile not found")
}
func (s *Service) State() any {
	s.mu.Lock()
	defer s.mu.Unlock()
	locked := len(s.vault.key) == 0
	state := map[string]any{"locked": locked, "exists": s.vault.exists(), "version": Version, "home": homeDir(), "dataPath": filepath.Dir(s.vault.path), "demo": s.demo}
	if locked {
		return state
	}
	b, _ := json.Marshal(s.vault.data)
	var data Data
	_ = json.Unmarshal(b, &data)
	for i := range data.Profiles {
		data.Profiles[i].Password = ""
	}
	state["data"] = data
	sessions := []SessionInfo{}
	for _, v := range s.sessions {
		sessions = append(sessions, v.Info())
	}
	state["sessions"] = sessions
	running := []string{}
	for k := range s.forwards {
		running = append(running, k)
	}
	state["runningTunnels"] = running
	transfers := []TransferInfo{}
	for _, t := range s.transfers {
		transfers = append(transfers, t.Info())
	}
	state["transfers"] = transfers
	return state
}
func homeDir() string { p, _ := os.UserHomeDir(); return p }
func (s *Service) record(name, kind, status, detail string) {
	_ = s.mutate(func(d *Data) error {
		d.History = append([]History{{id(), name, kind, now(), status, detail}}, d.History...)
		if len(d.History) > 500 {
			d.History = d.History[:500]
		}
		return nil
	})
}
func (s *Service) addKey(r Request) (Key, error) {
	if strings.TrimSpace(r.Name) == "" {
		return Key{}, errors.New("Give the key a name")
	}
	var raw any
	var err error
	if r.Op == "generateKey" {
		raw, err = generatePrivateKey(r.Type)
	} else {
		info, e := os.Stat(r.Path)
		if e != nil {
			return Key{}, e
		}
		if !info.Mode().IsRegular() || info.Size() > 1<<20 {
			return Key{}, errors.New("Choose a private-key file smaller than 1 MiB")
		}
		bytes, e := os.ReadFile(r.Path)
		if e != nil {
			return Key{}, e
		}
		defer clear(bytes)
		if r.Passphrase != "" {
			raw, err = ssh.ParseRawPrivateKeyWithPassphrase(bytes, []byte(r.Passphrase))
		} else {
			raw, err = ssh.ParseRawPrivateKey(bytes)
		}
	}
	if err != nil {
		return Key{}, err
	}
	signer, err := ssh.NewSignerFromKey(raw)
	if err != nil {
		return Key{}, err
	}
	encoded, err := encodePrivateKey(raw)
	if err != nil {
		return Key{}, err
	}
	k := Key{ID: id(), Name: r.Name, Type: signer.PublicKey().Type(), Fingerprint: ssh.FingerprintSHA256(signer.PublicKey()), PublicKey: strings.TrimSpace(string(ssh.MarshalAuthorizedKey(signer.PublicKey()))), Group: r.Key.Group, Created: now()}
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.vault.key) == 0 {
		return Key{}, errors.New("Vault is locked")
	}
	index := -1
	for i, existing := range s.vault.data.Keys {
		if existing.Fingerprint == k.Fingerprint {
			k.ID = existing.ID
			index = i
			break
		}
	}
	if err = s.secrets.Set(k.ID, encoded); err != nil {
		return Key{}, err
	}
	before, _ := json.Marshal(s.vault.data)
	if index >= 0 {
		s.vault.data.Keys[index] = k
	} else {
		s.vault.data.Keys = append(s.vault.data.Keys, k)
	}
	if err = s.vault.save(); err != nil {
		_ = json.Unmarshal(before, &s.vault.data)
		if index < 0 {
			_ = s.secrets.Delete(k.ID)
		}
	}
	return k, err
}
func (s *Service) exportMetadata(path string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if path == "" {
		return errors.New("Choose a destination path")
	}
	raw, err := os.ReadFile(s.vault.path)
	if err != nil {
		return err
	}
	return atomicWrite(path, raw)
}
func (s *Service) restoreMetadata(path, password string) error {
	v := vault{path: path}
	if err := v.unlock(password); err != nil {
		return err
	}
	defer v.lock()
	s.mu.Lock()
	active := len(s.sessions)
	s.mu.Unlock()
	if active > 0 {
		return errors.New("Close all terminal tabs before restoring workspace metadata")
	}
	return s.mutate(func(d *Data) error { *d = v.data; return nil })
}
