package core

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"golang.org/x/crypto/ssh"
	"io"
	"net"
	"strconv"
	"sync"
	"time"
)

type Forward struct {
	listener    net.Listener
	cancel      context.CancelFunc
	mu          sync.Mutex
	connections map[net.Conn]bool
	once        sync.Once
}

func (f *Forward) Close() {
	f.once.Do(func() {
		f.cancel()
		f.listener.Close()
		f.mu.Lock()
		defer f.mu.Unlock()
		for c := range f.connections {
			c.Close()
		}
	})
}
func validateTunnel(t Tunnel) error {
	if t.Name == "" || t.ProfileID == "" {
		return errors.New("Name and profile are required")
	}
	host, port, err := net.SplitHostPort(t.Bind)
	if err != nil {
		return errors.New("Listen address must be host:port")
	}
	n, e := strconv.Atoi(port)
	if e != nil || n < 1 || n > 65535 {
		return errors.New("Invalid listen port")
	}
	if host != "127.0.0.1" && host != "::1" && host != "localhost" {
		return errors.New("This build restricts tunnel listeners to loopback addresses")
	}
	if t.Type != "local" && t.Type != "remote" && t.Type != "dynamic" {
		return errors.New("Invalid tunnel type")
	}
	if t.Type != "dynamic" {
		_, p, e := net.SplitHostPort(t.Destination)
		if e != nil {
			return errors.New("Destination must be host:port")
		}
		n, e := strconv.Atoi(p)
		if e != nil || n < 1 || n > 65535 {
			return errors.New("Invalid destination port")
		}
	}
	return nil
}
func (s *Service) startTunnel(tunnelID string) error {
	s.mu.Lock()
	if _, ok := s.forwards[tunnelID]; ok {
		s.mu.Unlock()
		return errors.New("Tunnel is already running")
	}
	var t Tunnel
	for _, v := range s.vault.data.Tunnels {
		if v.ID == tunnelID {
			t = v
			break
		}
	}
	var session *Session
	for _, v := range s.sessions {
		info := v.Info()
		if info.ProfileID == t.ProfileID && info.Status == "connected" {
			session = v
			break
		}
	}
	s.mu.Unlock()
	if t.ID == "" {
		return errors.New("Tunnel not found")
	}
	if session == nil {
		return errors.New("Connect the selected SSH profile before starting this tunnel")
	}
	if err := validateTunnel(t); err != nil {
		return err
	}
	session.mu.Lock()
	client := session.client
	session.mu.Unlock()
	ctx, cancel := context.WithCancel(session.ctx)
	var listener net.Listener
	var err error
	if t.Type == "remote" {
		listener, err = client.Listen("tcp", t.Bind)
	} else {
		listener, err = net.Listen("tcp", t.Bind)
	}
	if err != nil {
		cancel()
		return err
	}
	f := &Forward{listener: listener, cancel: cancel, connections: map[net.Conn]bool{}}
	s.mu.Lock()
	if s.forwards[t.ID] != nil {
		s.mu.Unlock()
		f.Close()
		return errors.New("Tunnel is already running")
	}
	s.forwards[t.ID] = f
	s.mu.Unlock()
	go func() { <-ctx.Done(); f.Close() }()
	go func() {
		defer f.Close()
		defer func() {
			s.mu.Lock()
			if s.forwards[t.ID] == f {
				delete(s.forwards, t.ID)
			}
			s.mu.Unlock()
		}()
		for {
			conn, err := listener.Accept()
			if err != nil {
				return
			}
			f.mu.Lock()
			f.connections[conn] = true
			f.mu.Unlock()
			go func() {
				defer conn.Close()
				defer func() { f.mu.Lock(); delete(f.connections, conn); f.mu.Unlock() }()
				var remote net.Conn
				var err error
				switch t.Type {
				case "dynamic":
					remote, err = socksConnect(ctx, conn, client)
				case "remote":
					remote, err = (&net.Dialer{Timeout: 20 * time.Second}).DialContext(ctx, "tcp", t.Destination)
				default:
					remote, err = client.DialContext(ctx, "tcp", t.Destination)
				}
				if err != nil {
					return
				}
				defer remote.Close()
				f.mu.Lock()
				f.connections[remote] = true
				f.mu.Unlock()
				defer func() { f.mu.Lock(); delete(f.connections, remote); f.mu.Unlock() }()
				done := make(chan struct{})
				go func() { _, _ = io.Copy(conn, remote); conn.Close(); remote.Close(); close(done) }()
				_, _ = io.Copy(remote, conn)
				remote.Close()
				conn.Close()
				<-done
			}()
		}
	}()
	return nil
}
func (s *Service) stopTunnel(tunnelID string) {
	s.mu.Lock()
	f := s.forwards[tunnelID]
	delete(s.forwards, tunnelID)
	s.mu.Unlock()
	if f != nil {
		f.Close()
	}
}
func socksConnect(ctx context.Context, conn net.Conn, client *ssh.Client) (net.Conn, error) {
	_ = conn.SetDeadline(time.Now().Add(20 * time.Second))
	header := make([]byte, 2)
	if _, err := io.ReadFull(conn, header); err != nil {
		return nil, err
	}
	if header[0] != 5 {
		return nil, errors.New("SOCKS5 required")
	}
	methods := make([]byte, int(header[1]))
	if _, err := io.ReadFull(conn, methods); err != nil {
		return nil, err
	}
	allowed := false
	for _, m := range methods {
		if m == 0 {
			allowed = true
		}
	}
	if !allowed {
		conn.Write([]byte{5, 255})
		return nil, errors.New("Unsupported SOCKS authentication")
	}
	if _, err := conn.Write([]byte{5, 0}); err != nil {
		return nil, err
	}
	request := make([]byte, 4)
	if _, err := io.ReadFull(conn, request); err != nil {
		return nil, err
	}
	if request[0] != 5 || request[1] != 1 || request[2] != 0 {
		conn.Write([]byte{5, 7, 0, 1, 0, 0, 0, 0, 0, 0})
		return nil, errors.New("Only SOCKS5 CONNECT is supported")
	}
	host := ""
	switch request[3] {
	case 1:
		b := make([]byte, 4)
		if _, err := io.ReadFull(conn, b); err != nil {
			return nil, err
		}
		host = net.IP(b).String()
	case 4:
		b := make([]byte, 16)
		if _, err := io.ReadFull(conn, b); err != nil {
			return nil, err
		}
		host = net.IP(b).String()
	case 3:
		b := make([]byte, 1)
		if _, err := io.ReadFull(conn, b); err != nil {
			return nil, err
		}
		name := make([]byte, int(b[0]))
		if len(name) == 0 {
			return nil, errors.New("Empty hostname")
		}
		if _, err := io.ReadFull(conn, name); err != nil {
			return nil, err
		}
		host = string(name)
	default:
		return nil, errors.New("Invalid address type")
	}
	port := make([]byte, 2)
	if _, err := io.ReadFull(conn, port); err != nil {
		return nil, err
	}
	dialCtx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	remote, err := client.DialContext(dialCtx, "tcp", net.JoinHostPort(host, fmt.Sprint(binary.BigEndian.Uint16(port))))
	if err != nil {
		conn.Write([]byte{5, 5, 0, 1, 0, 0, 0, 0, 0, 0})
		return nil, err
	}
	if _, err = conn.Write([]byte{5, 0, 0, 1, 0, 0, 0, 0, 0, 0}); err != nil {
		remote.Close()
		return nil, err
	}
	_ = conn.SetDeadline(time.Time{})
	return remote, nil
}
