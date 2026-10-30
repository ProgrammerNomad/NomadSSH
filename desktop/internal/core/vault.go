package core

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"golang.org/x/crypto/argon2"
	"io"
	"os"
	"path/filepath"
)

type envelope struct {
	Version    int    `json:"version"`
	Salt       []byte `json:"salt"`
	Nonce      []byte `json:"nonce"`
	Ciphertext []byte `json:"ciphertext"`
}
type vault struct {
	path string
	key  []byte
	salt []byte
	data Data
}

var vaultAAD = []byte("NomadSSH/vault/1/argon2id/t3/m65536/p2")

func (v *vault) exists() bool { _, err := os.Stat(v.path); return err == nil }
func derive(password string, salt []byte) []byte {
	return argon2.IDKey([]byte(password), salt, 3, 64*1024, 2, 32)
}
func (v *vault) create(password string) error {
	if v.exists() {
		return errors.New("A vault already exists; unlock it instead")
	}
	if len(password) < 12 {
		return errors.New("Use a master password of at least 12 characters")
	}
	v.salt = make([]byte, 16)
	if _, err := rand.Read(v.salt); err != nil {
		return err
	}
	v.key = derive(password, v.salt)
	v.data = newData()
	if err := v.save(); err != nil {
		v.lock()
		return err
	}
	return nil
}
func (v *vault) unlock(password string) error {
	f, err := os.Open(v.path)
	if err != nil {
		return err
	}
	defer f.Close()
	raw, err := io.ReadAll(io.LimitReader(f, (32<<20)+1))
	if err != nil {
		return err
	}
	if len(raw) > 32<<20 {
		return errors.New("Vault exceeds the supported size")
	}
	var e envelope
	if json.Unmarshal(raw, &e) != nil || e.Version != 1 || len(e.Salt) != 16 || len(e.Nonce) != 12 {
		return errors.New("Invalid or unsupported vault format")
	}
	key := derive(password, e.Salt)
	block, _ := aes.NewCipher(key)
	gcm, _ := cipher.NewGCM(block)
	plain, err := gcm.Open(nil, e.Nonce, e.Ciphertext, vaultAAD)
	if err != nil {
		clear(key)
		return errors.New("Incorrect password or damaged vault")
	}
	defer clear(plain)
	var data Data
	if err = json.Unmarshal(plain, &data); err != nil {
		clear(key)
		return errors.New("Invalid vault contents")
	}
	if data.Version != 1 {
		clear(key)
		return errors.New("Unsupported data version")
	}
	v.key = key
	v.salt = e.Salt
	v.data = data
	return nil
}
func (v *vault) save() error {
	if len(v.key) == 0 {
		return errors.New("Vault is locked")
	}
	plain, err := json.Marshal(v.data)
	if err != nil {
		return err
	}
	defer clear(plain)
	block, err := aes.NewCipher(v.key)
	if err != nil {
		return err
	}
	gcm, _ := cipher.NewGCM(block)
	nonce := make([]byte, gcm.NonceSize())
	if _, err = rand.Read(nonce); err != nil {
		return err
	}
	raw, err := json.Marshal(envelope{1, v.salt, nonce, gcm.Seal(nil, nonce, plain, vaultAAD)})
	if err != nil {
		return err
	}
	return atomicWrite(v.path, raw)
}
func atomicWrite(path string, data []byte) error {
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}
	f, err := os.CreateTemp(filepath.Dir(path), ".nomadssh-*")
	if err != nil {
		return err
	}
	tmp := f.Name()
	defer os.Remove(tmp)
	if err = f.Chmod(0600); err != nil {
		f.Close()
		return err
	}
	if _, err = f.Write(data); err != nil {
		f.Close()
		return err
	}
	if err = f.Sync(); err != nil {
		f.Close()
		return err
	}
	if err = f.Close(); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}
func (v *vault) lock() { clear(v.key); v.key = nil; v.salt = nil; v.data = Data{} }
func (v *vault) changePassword(old, newPassword string) error {
	if len(newPassword) < 12 {
		return errors.New("Use at least 12 characters")
	}
	check := vault{path: v.path}
	if err := check.unlock(old); err != nil {
		return err
	}
	check.lock()
	previousKey, previousSalt := v.key, v.salt
	v.salt = make([]byte, 16)
	if _, err := rand.Read(v.salt); err != nil {
		v.salt = previousSalt
		return err
	}
	v.key = derive(newPassword, v.salt)
	if err := v.save(); err != nil {
		clear(v.key)
		v.key = previousKey
		v.salt = previousSalt
		return fmt.Errorf("Password change failed: %w", err)
	}
	clear(previousKey)
	return nil
}
