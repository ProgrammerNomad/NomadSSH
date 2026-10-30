package core

import (
	"bufio"
	"crypto/ed25519"
	"crypto/rand"
	"errors"
	"fmt"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
	"io"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// Sandbox is an explicit local protocol test endpoint, never started in normal mode.
// Its shell implements a small documented command set, not an operating-system shell.
type Sandbox struct {
	Listener       net.Listener
	Signer         ssh.Signer
	Password       string
	mu             sync.Mutex
	connections    []net.Conn
	AuthorizedKeys []ssh.PublicKey
	closed         bool
	Root           string
}

func NewSandbox() (sb *Sandbox, err error) {
	_, private, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, err
	}
	signer, err := ssh.NewSignerFromKey(private)
	if err != nil {
		return nil, err
	}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}
	root, err := os.MkdirTemp("", "nomadssh-sftp-sandbox-")
	if err != nil {
		listener.Close()
		return nil, err
	}
	sb = &Sandbox{Listener: listener, Signer: signer, Password: id(), Root: root}
	_ = os.WriteFile(filepath.Join(root, "README.txt"), []byte("NomadSSH local protocol sandbox. This is test data, not a remote server.\n"), 0600)
	_ = os.Mkdir(filepath.Join(root, "uploads"), 0700)
	config := &ssh.ServerConfig{PasswordCallback: func(metadata ssh.ConnMetadata, password []byte) (*ssh.Permissions, error) {
		if metadata.User() == "demo" && string(password) == sb.Password {
			return nil, nil
		}
		return nil, errors.New("Authentication failed")
	}}
	config.PublicKeyCallback = func(metadata ssh.ConnMetadata, key ssh.PublicKey) (*ssh.Permissions, error) {
		sb.mu.Lock()
		defer sb.mu.Unlock()
		for _, allowed := range sb.AuthorizedKeys {
			if metadata.User() == "demo" && string(allowed.Marshal()) == string(key.Marshal()) {
				return nil, nil
			}
		}
		return nil, errors.New("Unknown public key")
	}
	config.AddHostKey(signer)
	go func() {
		for {
			conn, e := listener.Accept()
			if e != nil {
				return
			}
			sb.mu.Lock()
			if sb.closed {
				sb.mu.Unlock()
				conn.Close()
				return
			}
			sb.connections = append(sb.connections, conn)
			sb.mu.Unlock()
			go sb.serve(conn, config)
		}
	}()
	return sb, nil
}
func (sb *Sandbox) Close() {
	sb.mu.Lock()
	defer sb.mu.Unlock()
	if sb.closed {
		return
	}
	sb.closed = true
	sb.Listener.Close()
	for _, c := range sb.connections {
		c.Close()
	}
}
func (sb *Sandbox) serve(raw net.Conn, config *ssh.ServerConfig) {
	defer raw.Close()
	conn, channels, requests, err := ssh.NewServerConn(raw, config)
	if err != nil {
		return
	}
	defer conn.Close()
	go sb.globalRequests(conn, requests)

	for ch := range channels {
		switch ch.ChannelType() {
		case "session":
			channel, requests, err := ch.Accept()
			if err != nil {
				continue
			}
			go sb.session(channel, requests)
		case "direct-tcpip":
			var payload struct {
				Host       string
				Port       uint32
				Origin     string
				OriginPort uint32
			}
			if ssh.Unmarshal(ch.ExtraData(), &payload) != nil || !(payload.Host == "localhost" || net.ParseIP(payload.Host).IsLoopback()) {
				ch.Reject(ssh.Prohibited, "Sandbox permits only loopback targets")
				continue
			}
			target, err := net.DialTimeout("tcp", net.JoinHostPort(payload.Host, fmt.Sprint(payload.Port)), 3*time.Second)
			if err != nil {
				ch.Reject(ssh.ConnectionFailed, "Target unavailable")
				continue
			}
			channel, reqs, err := ch.Accept()
			if err != nil {
				target.Close()
				continue
			}
			go ssh.DiscardRequests(reqs)
			go func() {
				defer target.Close()
				defer channel.Close()
				go func() { io.Copy(channel, target); channel.Close() }()
				io.Copy(target, channel)
			}()
		default:
			ch.Reject(ssh.UnknownChannelType, "Unsupported channel")
		}
	}
}
func (sb *Sandbox) globalRequests(conn *ssh.ServerConn, requests <-chan *ssh.Request) {
	listeners := map[string]net.Listener{}
	defer func() {
		for _, l := range listeners {
			l.Close()
		}
	}()
	for r := range requests {
		if r.Type == "keepalive@openssh.com" {
			r.Reply(true, nil)
			continue
		}
		var payload struct {
			Host string
			Port uint32
		}
		if ssh.Unmarshal(r.Payload, &payload) != nil || !net.ParseIP(payload.Host).IsLoopback() {
			r.Reply(false, nil)
			continue
		}
		address := net.JoinHostPort(payload.Host, fmt.Sprint(payload.Port))
		if r.Type == "cancel-tcpip-forward" {
			if l := listeners[address]; l != nil {
				l.Close()
				delete(listeners, address)
				r.Reply(true, nil)
			} else {
				r.Reply(false, nil)
			}
			continue
		}
		if r.Type != "tcpip-forward" {
			r.Reply(false, nil)
			continue
		}
		listener, err := net.Listen("tcp", address)
		if err != nil {
			r.Reply(false, nil)
			continue
		}
		port := uint32(listener.Addr().(*net.TCPAddr).Port)
		address = net.JoinHostPort(payload.Host, fmt.Sprint(port))
		listeners[address] = listener
		r.Reply(true, ssh.Marshal(struct{ Port uint32 }{port}))
		go func(host string, port uint32) {
			for {
				c, err := listener.Accept()
				if err != nil {
					return
				}
				go func() {
					defer c.Close()
					origin := c.RemoteAddr().(*net.TCPAddr)
					data := struct {
						Host       string
						Port       uint32
						Origin     string
						OriginPort uint32
					}{host, port, origin.IP.String(), uint32(origin.Port)}
					ch, reqs, err := conn.OpenChannel("forwarded-tcpip", ssh.Marshal(data))
					if err != nil {
						return
					}
					defer ch.Close()
					go ssh.DiscardRequests(reqs)
					go func() { io.Copy(ch, c); ch.Close() }()
					io.Copy(c, ch)
				}()
			}
		}(payload.Host, port)
	}
}
func (sb *Sandbox) session(ch ssh.Channel, requests <-chan *ssh.Request) {
	defer ch.Close()
	for req := range requests {
		switch req.Type {
		case "pty-req", "window-change":
			_ = req.Reply(true, nil)
		case "subsystem":
			var payload struct{ Name string }
			if ssh.Unmarshal(req.Payload, &payload) != nil || payload.Name != "sftp" {
				req.Reply(false, nil)
				continue
			}
			req.Reply(true, nil)
			server, err := sftp.NewServer(ch, sftp.WithServerWorkingDirectory(sb.Root))
			if err == nil {
				defer server.Close()
				_ = server.Serve()
			}
			return
		case "shell":
			req.Reply(true, nil)
			go ssh.DiscardRequests(requests)
			io.WriteString(ch, "\x1b[36mNomadSSH local SSH protocol sandbox\x1b[0m\r\nEncrypted transport is live. No remote machine is connected.\r\nCommands: help, date, whoami, pwd, ls, echo, clear, exit\r\n\r\n\x1b[32mdemo@localhost\x1b[0m ~ $ ")
			reader := bufio.NewReader(ch)
			var line strings.Builder
			for {
				b, err := reader.ReadByte()
				if err != nil {
					return
				}
				if b == 3 {
					line.Reset()
					io.WriteString(ch, "^C\r\n$ ")
					continue
				}
				if b == 127 || b == 8 {
					str := line.String()
					if len(str) > 0 {
						line.Reset()
						line.WriteString(str[:len(str)-1])
						io.WriteString(ch, "\b \b")
					}
					continue
				}
				if b != '\r' && b != '\n' {
					if line.Len() < 4096 {
						line.WriteByte(b)
						ch.Write([]byte{b})
					}
					continue
				}
				command := strings.TrimSpace(line.String())
				line.Reset()
				io.WriteString(ch, "\r\n")
				switch {
				case command == "exit":
					ch.SendRequest("exit-status", false, ssh.Marshal(struct{ Status uint32 }{0}))
					return
				case command == "date":
					io.WriteString(ch, time.Now().Format(time.RFC1123)+"\r\n")
				case command == "whoami":
					io.WriteString(ch, "demo\r\n")
				case command == "pwd":
					io.WriteString(ch, sb.Root+"\r\n")
				case command == "ls":
					io.WriteString(ch, "README.txt  uploads/\r\n")
				case command == "clear":
					io.WriteString(ch, "\x1b[2J\x1b[H")
				case strings.HasPrefix(command, "echo "):
					io.WriteString(ch, strings.TrimPrefix(command, "echo ")+"\r\n")
				case command == "help":
					io.WriteString(ch, "This sandbox tests SSH, SFTP and local/remote/dynamic forwarding. Use Local terminal for your real shell.\r\n")
				case command != "":
					io.WriteString(ch, "Sandbox command not supported. Type help.\r\n")
				}
				io.WriteString(ch, "\x1b[32mdemo@localhost\x1b[0m ~ $ ")
			}
		default:
			req.Reply(false, nil)
		}
	}
}
func (s *Service) ConfigureDemo(sb *Sandbox) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.vault.exists() {
		return errors.New("Demo requires a new, isolated data directory")
	}
	if err := s.vault.create(id()); err != nil {
		return err
	}
	s.demo = true
	address := sb.Listener.Addr().(*net.TCPAddr)
	s.vault.data.Profiles = []Profile{{ID: id(), Name: "Protocol sandbox", Host: "127.0.0.1", Port: address.Port, Username: "demo", Auth: "password", Password: sb.Password, Group: "Development", Tags: []string{"local", "sandbox"}, Pinned: true, Color: "cyan"}, {ID: id(), Name: "SFTP test workspace", Host: "127.0.0.1", Port: address.Port, Username: "demo", Auth: "password", Password: sb.Password, Group: "Development", Tags: []string{"files", "sandbox"}, Color: "purple"}, {ID: id(), Name: "Tunnel playground", Host: "127.0.0.1", Port: address.Port, Username: "demo", Auth: "password", Password: sb.Password, Group: "Networking", Tags: []string{"tunnels", "sandbox"}, Color: "blue"}}
	s.vault.data.Snippets = []Snippet{{id(), "Server time", "date", "System"}, {id(), "Current identity", "whoami", "System"}, {id(), "Workspace files", "ls", "System"}}
	// This identity belongs to the freshly created in-process test server, not an external host.
	s.vault.data.Hosts = []KnownHost{{Host: s.vault.data.Profiles[0].Address(), Fingerprint: ssh.FingerprintSHA256(sb.Signer.PublicKey()), Type: sb.Signer.PublicKey().Type(), Added: now()}}
	s.vault.data.Settings.IdleMinutes = 120
	return s.vault.save()
}
