package core

import (
	"bytes"
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"golang.org/x/oauth2"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	"net/textproto"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type driveConfig struct {
	ClientID string `json:"clientId"`
	AutoSync bool   `json:"autoSync"`
	LastHash string `json:"lastHash"`
	LastSync string `json:"lastSync"`
}
type DriveSnapshot struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Created string `json:"createdTime"`
	Size    string `json:"size"`
}

func (s *Service) driveConfigPath() string {
	return filepath.Join(filepath.Dir(s.vault.path), "drive-config.json")
}
func (s *Service) loadDriveConfig() (driveConfig, error) {
	var c driveConfig
	b, err := os.ReadFile(s.driveConfigPath())
	if os.IsNotExist(err) {
		return c, nil
	}
	if err != nil {
		return c, err
	}
	err = json.Unmarshal(b, &c)
	return c, err
}
func (s *Service) configureDrive(r Request) error {
	s.driveMu.Lock()
	defer s.driveMu.Unlock()
	clientID := strings.TrimSpace(r.ClientID)
	if !strings.HasSuffix(clientID, ".apps.googleusercontent.com") {
		return errors.New("Enter a Google OAuth Desktop app client ID")
	}
	c, err := s.loadDriveConfig()
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.vault.key) == 0 {
		return errors.New("Vault is locked")
	}
	if r.ClientSecret != "" {
		if err = s.secrets.Set("drive-client-secret", r.ClientSecret); err != nil {
			return err
		}
	}
	if c.ClientID != "" && c.ClientID != clientID {
		_ = s.secrets.Delete("drive-token")
		c.LastHash = ""
		c.LastSync = ""
		if r.ClientSecret == "" {
			_ = s.secrets.Delete("drive-client-secret")
		}
	}
	c.ClientID = clientID
	c.AutoSync = r.AutoSync
	b, _ := json.Marshal(c)
	return atomicWrite(s.driveConfigPath(), b)
}
func (s *Service) driveStatus() (any, error) {
	s.driveMu.Lock()
	defer s.driveMu.Unlock()
	c, err := s.loadDriveConfig()
	if err != nil {
		return nil, err
	}
	connected := false
	if c.ClientID != "" {
		s.mu.Lock()
		_, err = s.secrets.Get("drive-token")
		s.mu.Unlock()
		connected = err == nil
	}
	return map[string]any{"clientId": c.ClientID, "autoSync": c.AutoSync, "lastSync": c.LastSync, "connected": connected}, nil
}
func (s *Service) oauthConfig(c driveConfig) (*oauth2.Config, error) {
	if c.ClientID == "" {
		return nil, errors.New("Configure your Google Desktop app client ID first")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.vault.key) == 0 {
		return nil, errors.New("Vault is locked")
	}
	secret, _ := s.secrets.Get("drive-client-secret")
	return &oauth2.Config{ClientID: c.ClientID, ClientSecret: secret, Scopes: []string{"https://www.googleapis.com/auth/drive.appdata"}, Endpoint: oauth2.Endpoint{AuthURL: "https://accounts.google.com/o/oauth2/v2/auth", TokenURL: "https://oauth2.googleapis.com/token"}}, nil
}
func (s *Service) BeginDriveAuth() (string, error) {
	s.driveMu.Lock()
	c, err := s.loadDriveConfig()
	s.driveMu.Unlock()
	if err != nil {
		return "", err
	}
	config, err := s.oauthConfig(c)
	if err != nil {
		return "", err
	}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return "", err
	}
	config.RedirectURL = "http://" + listener.Addr().String() + "/callback"
	state := id()
	verifier := oauth2.GenerateVerifier()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	mux := http.NewServeMux()
	server := &http.Server{Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		if r.Method != "GET" || subtle.ConstantTimeCompare([]byte(r.URL.Query().Get("state")), []byte(state)) != 1 {
			http.Error(w, "Invalid authorization response", http.StatusBadRequest)
			return
		}
		defer cancel()
		if r.URL.Query().Get("error") != "" {
			http.Error(w, "Authorization was not completed. Return to NomadSSH.", 400)
			return
		}
		token, err := config.Exchange(ctx, r.URL.Query().Get("code"), oauth2.VerifierOption(verifier))
		if err != nil {
			http.Error(w, "Authorization failed. Return to NomadSSH and retry.", 400)
			return
		}
		raw, _ := json.Marshal(token)
		s.mu.Lock()
		if len(s.vault.key) == 0 {
			err = errors.New("Vault was locked")
		} else {
			err = s.secrets.Set("drive-token", string(raw))
		}
		s.mu.Unlock()
		if err != nil {
			http.Error(w, "Could not save credentials in OS secure storage.", 500)
			return
		}
		io.WriteString(w, "Google Drive connected. You can close this tab and return to NomadSSH.")
		s.emit(Event{Kind: "driveConnected"})
	})
	go func() { defer cancel(); _ = server.Serve(listener) }()
	go func() {
		select {
		case <-ctx.Done():
		case <-s.stop:
		}
		shutdown, done := context.WithTimeout(context.Background(), 3*time.Second)
		defer done()
		_ = server.Shutdown(shutdown)
	}()
	return config.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.SetAuthURLParam("prompt", "consent"), oauth2.S256ChallengeOption(verifier)), nil
}
func (s *Service) driveClient(ctx context.Context, c driveConfig) (*http.Client, error) {
	config, err := s.oauthConfig(c)
	if err != nil {
		return nil, err
	}
	s.mu.Lock()
	raw, err := s.secrets.Get("drive-token")
	s.mu.Unlock()
	if err != nil {
		return nil, errors.New("Connect Google Drive first")
	}
	var token oauth2.Token
	if json.Unmarshal([]byte(raw), &token) != nil {
		return nil, errors.New("Invalid OAuth credentials; reconnect Google Drive")
	}
	source := config.TokenSource(ctx, &token)
	fresh, err := source.Token()
	if err != nil {
		return nil, errors.New("Google authorization expired; reconnect Google Drive")
	}
	if fresh.AccessToken != token.AccessToken {
		encoded, _ := json.Marshal(fresh)
		s.mu.Lock()
		err = s.secrets.Set("drive-token", string(encoded))
		s.mu.Unlock()
		if err != nil {
			return nil, err
		}
	}
	client := oauth2.NewClient(ctx, oauth2.StaticTokenSource(fresh))
	client.Timeout = 40 * time.Second
	return client, nil
}
func driveResponse(resp *http.Response, err error) ([]byte, error) {
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(io.LimitReader(resp.Body, (32<<20)+1))
	if err != nil {
		return nil, err
	}
	if len(b) > 32<<20 {
		return nil, errors.New("Drive response exceeds the allowed size")
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("Google Drive returned HTTP %d; check your authorization and Drive API configuration", resp.StatusCode)
	}
	return b, nil
}
func (s *Service) uploadDrive() (any, error) {
	s.driveMu.Lock()
	defer s.driveMu.Unlock()
	c, err := s.loadDriveConfig()
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	client, err := s.driveClient(ctx, c)
	if err != nil {
		return nil, err
	}
	s.mu.Lock()
	if len(s.vault.key) == 0 {
		s.mu.Unlock()
		return nil, errors.New("Vault is locked")
	}
	raw, err := os.ReadFile(s.vault.path)
	s.mu.Unlock()
	if err != nil {
		return nil, err
	}
	hash := sha256.Sum256(raw)
	digest := hex.EncodeToString(hash[:])
	if digest == c.LastHash {
		return map[string]any{"unchanged": true}, nil
	}
	// Append immutable snapshots. Concurrent devices never overwrite each other's state.
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	metadata, _ := json.Marshal(map[string]any{"name": "nomadssh-" + time.Now().UTC().Format("20060102T150405") + "-" + id()[:8] + ".json", "parents": []string{"appDataFolder"}, "mimeType": "application/json"})
	p, _ := writer.CreatePart(textproto.MIMEHeader{"Content-Type": []string{"application/json; charset=UTF-8"}})
	p.Write(metadata)
	p, _ = writer.CreatePart(textproto.MIMEHeader{"Content-Type": []string{"application/json"}})
	p.Write(raw)
	writer.Close()
	req, err := http.NewRequestWithContext(ctx, "POST", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size", &body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "multipart/related; boundary="+writer.Boundary())
	result, err := driveResponse(client.Do(req))
	if err != nil {
		return nil, err
	}
	c.LastHash = digest
	c.LastSync = now()
	encoded, _ := json.Marshal(c)
	if err = atomicWrite(s.driveConfigPath(), encoded); err != nil {
		return nil, err
	}
	var snapshot DriveSnapshot
	err = json.Unmarshal(result, &snapshot)
	return snapshot, err
}
func (s *Service) listDrive() ([]DriveSnapshot, error) {
	s.driveMu.Lock()
	defer s.driveMu.Unlock()
	c, err := s.loadDriveConfig()
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	client, err := s.driveClient(ctx, c)
	if err != nil {
		return nil, err
	}
	q := url.Values{"spaces": {"appDataFolder"}, "q": {"name contains 'nomadssh-' and trashed = false"}, "pageSize": {"100"}, "orderBy": {"createdTime desc"}, "fields": {"files(id,name,createdTime,size)"}}
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://www.googleapis.com/drive/v3/files?"+q.Encode(), nil)
	raw, err := driveResponse(client.Do(req))
	if err != nil {
		return nil, err
	}
	var data struct {
		Files []DriveSnapshot `json:"files"`
	}
	err = json.Unmarshal(raw, &data)
	if data.Files == nil {
		data.Files = []DriveSnapshot{}
	}
	return data.Files, err
}
func (s *Service) restoreDrive(fileID, password string) error {
	s.driveMu.Lock()
	defer s.driveMu.Unlock()
	if fileID == "" {
		return errors.New("Choose a cloud snapshot")
	}
	c, err := s.loadDriveConfig()
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	client, err := s.driveClient(ctx, c)
	if err != nil {
		return err
	}
	req, _ := http.NewRequestWithContext(ctx, "GET", "https://www.googleapis.com/drive/v3/files/"+url.PathEscape(fileID)+"?alt=media", nil)
	raw, err := driveResponse(client.Do(req))
	if err != nil {
		return err
	}
	file, err := os.CreateTemp(filepath.Dir(s.vault.path), "cloud-snapshot-*")
	if err != nil {
		return err
	}
	name := file.Name()
	defer os.Remove(name)
	if err = file.Chmod(0600); err != nil {
		file.Close()
		return err
	}
	if _, err = file.Write(raw); err != nil {
		file.Close()
		return err
	}
	if err = file.Close(); err != nil {
		return err
	}
	return s.restoreMetadata(name, password)
}
func (s *Service) autoSyncLoop() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-s.stop:
			return
		case <-ticker.C:
			s.mu.Lock()
			unlocked := len(s.vault.key) > 0
			s.mu.Unlock()
			if !unlocked {
				continue
			}
			s.driveMu.Lock()
			config, err := s.loadDriveConfig()
			s.driveMu.Unlock()
			if err == nil && config.AutoSync && config.ClientID != "" {
				if _, err = s.uploadDrive(); err != nil {
					s.emit(Event{"syncError", "", err.Error()})
				}
			}
		}
	}
}
