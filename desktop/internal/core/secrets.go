package core

import (
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"github.com/zalando/go-keyring"
	"golang.org/x/crypto/ssh"
	"os"
	"strconv"
	"strings"
)

// Chunks accommodate the Windows credential value size limit. No fallback file store.
type secretStore interface {
	Set(string, string) error
	Get(string) (string, error)
	Delete(string) error
}
type systemSecrets struct{ namespace string }

type secretManifest struct {
	Prefix string `json:"prefix"`
	Count  int    `json:"count"`
}

func parseManifest(key, raw string) (secretManifest, error) {
	var m secretManifest
	if json.Unmarshal([]byte(raw), &m) != nil {
		m.Prefix = key
		m.Count, _ = strconv.Atoi(raw)
	}
	if m.Count < 1 || m.Count > 128 || m.Prefix == "" {
		return m, errors.New("Invalid secure-storage record")
	}
	return m, nil
}
func (s systemSecrets) clean(m secretManifest) {
	for i := 0; i < m.Count; i++ {
		_ = keyring.Delete(s.namespace, fmt.Sprintf("%s.%d", m.Prefix, i))
	}
}
func (s systemSecrets) Set(key, value string) error {
	if len(value) == 0 || len(value) > 128*1800 {
		return errors.New("Secret is empty or too large")
	}
	old, _ := keyring.Get(s.namespace, key)
	m := secretManifest{Prefix: key + "." + id(), Count: (len(value) + 1799) / 1800}
	for i := 0; i < m.Count; i++ {
		end := min((i+1)*1800, len(value))
		if err := keyring.Set(s.namespace, fmt.Sprintf("%s.%d", m.Prefix, i), value[i*1800:end]); err != nil {
			s.clean(m)
			return fmt.Errorf("OS secure storage unavailable: %w", err)
		}
	}
	raw, _ := json.Marshal(m)
	if err := keyring.Set(s.namespace, key, string(raw)); err != nil {
		s.clean(m)
		return err
	}
	if previous, err := parseManifest(key, old); err == nil {
		s.clean(previous)
	}
	return nil
}
func (s systemSecrets) Get(key string) (string, error) {
	raw, err := keyring.Get(s.namespace, key)
	if err != nil {
		return "", errors.New("Secret is unavailable on this device; import the key or sign in again")
	}
	m, err := parseManifest(key, raw)
	if err != nil {
		return "", err
	}
	var b strings.Builder
	for i := 0; i < m.Count; i++ {
		part, err := keyring.Get(s.namespace, fmt.Sprintf("%s.%d", m.Prefix, i))
		if err != nil {
			return "", err
		}
		b.WriteString(part)
	}
	return b.String(), nil
}
func (s systemSecrets) Delete(key string) error {
	raw, err := keyring.Get(s.namespace, key)
	if err != nil {
		return err
	}
	m, err := parseManifest(key, raw)
	if err != nil {
		return err
	}
	if err = keyring.Delete(s.namespace, key); err != nil {
		return err
	}
	s.clean(m)
	return nil
}
func importPrivateKey(path, passphrase string) (ssh.Signer, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}
	if !info.Mode().IsRegular() || info.Size() > 1<<20 {
		return nil, errors.New("Choose a private-key file smaller than 1 MiB")
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	defer clear(raw)
	if passphrase != "" {
		return ssh.ParsePrivateKeyWithPassphrase(raw, []byte(passphrase))
	}
	return ssh.ParsePrivateKey(raw)
}
func generatePrivateKey(kind string) (any, error) {
	switch kind {
	case "ed25519":
		_, k, e := ed25519.GenerateKey(rand.Reader)
		return k, e
	case "rsa":
		return rsa.GenerateKey(rand.Reader, 3072)
	case "ecdsa":
		return ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	default:
		return nil, errors.New("Unsupported key type")
	}
}
func encodePrivateKey(key any) (string, error) {
	block, err := ssh.MarshalPrivateKey(key, "NomadSSH")
	if err != nil {
		return "", err
	}
	return string(pem.EncodeToMemory(block)), nil
}
