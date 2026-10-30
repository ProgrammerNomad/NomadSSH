package core

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net"
	"strconv"
	"strings"
	"time"
)

type Profile struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Host          string   `json:"host"`
	Port          int      `json:"port"`
	Username      string   `json:"username"`
	Auth          string   `json:"auth"`
	Password      string   `json:"password,omitempty"`
	KeyID         string   `json:"keyId"`
	Group         string   `json:"group"`
	Tags          []string `json:"tags"`
	Pinned        bool     `json:"pinned"`
	Color         string   `json:"color"`
	LastConnected string   `json:"lastConnected"`
	JumpID        string   `json:"jumpId"`
}
type Key struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Fingerprint string `json:"fingerprint"`
	PublicKey   string `json:"publicKey"`
	Group       string `json:"group"`
	Created     string `json:"created"`
}
type KnownHost struct {
	Host        string `json:"host"`
	Fingerprint string `json:"fingerprint"`
	Type        string `json:"type"`
	Added       string `json:"added"`
}
type Snippet struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Command  string `json:"command"`
	Category string `json:"category"`
}
type Tunnel struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	ProfileID   string `json:"profileId"`
	Type        string `json:"type"`
	Bind        string `json:"bind"`
	Destination string `json:"destination"`
}
type History struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Kind   string `json:"kind"`
	Time   string `json:"time"`
	Status string `json:"status"`
	Detail string `json:"detail"`
}
type Settings struct {
	FontSize    int    `json:"fontSize"`
	Scrollback  int    `json:"scrollback"`
	IdleMinutes int    `json:"idleMinutes"`
	Theme       string `json:"theme"`
}
type Data struct {
	Version  int         `json:"version"`
	Profiles []Profile   `json:"profiles"`
	Keys     []Key       `json:"keys"`
	Hosts    []KnownHost `json:"hosts"`
	Snippets []Snippet   `json:"snippets"`
	Tunnels  []Tunnel    `json:"tunnels"`
	History  []History   `json:"history"`
	Settings Settings    `json:"settings"`
}

func newData() Data {
	return Data{Version: 1, Profiles: []Profile{}, Keys: []Key{}, Hosts: []KnownHost{}, Snippets: []Snippet{}, Tunnels: []Tunnel{}, History: []History{}, Settings: Settings{FontSize: 14, Scrollback: 10000, IdleMinutes: 15, Theme: "dark"}}
}
func id() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}
func now() string                 { return time.Now().UTC().Format(time.RFC3339) }
func (p Profile) Address() string { return net.JoinHostPort(p.Host, strconv.Itoa(p.Port)) }
func (p Profile) Validate() error {
	if strings.TrimSpace(p.Name) == "" || strings.TrimSpace(p.Host) == "" || strings.TrimSpace(p.Username) == "" {
		return errors.New("Name, host and username are required")
	}
	if strings.ContainsAny(p.Host, "\x00\r\n /\\") || strings.ContainsAny(p.Username, "\x00\r\n") {
		return errors.New("Invalid host or username")
	}
	if p.Port < 1 || p.Port > 65535 {
		return errors.New("Port must be between 1 and 65535")
	}
	if p.Auth != "password" && p.Auth != "key" && p.Auth != "agent" {
		return errors.New("Choose password, private key or SSH agent authentication")
	}
	if p.Auth == "key" && p.KeyID == "" {
		return errors.New("Select a private key")
	}
	return nil
}
