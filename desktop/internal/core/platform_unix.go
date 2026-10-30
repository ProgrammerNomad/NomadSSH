//go:build !windows

package core

import (
	"context"
	"errors"
	"github.com/creack/pty"
	"net"
	"os"
	"os/exec"
)

type unixTerminal struct {
	*os.File
	cmd *exec.Cmd
}

func (t *unixTerminal) Resize(cols, rows int) error {
	return pty.Setsize(t.File, &pty.Winsize{Cols: uint16(cols), Rows: uint16(rows)})
}
func (t *unixTerminal) Close() error {
	err := t.File.Close()
	if t.cmd.Process != nil {
		_ = t.cmd.Process.Kill()
	}
	return err
}
func startTerminal() (terminal, error) {
	shell := os.Getenv("SHELL")
	if shell == "" {
		shell = "/bin/sh"
	}
	cmd := exec.Command(shell)
	cmd.Dir = homeDir()
	cmd.Env = append(os.Environ(), "TERM=xterm-256color")
	f, err := pty.StartWithSize(cmd, &pty.Winsize{Cols: 120, Rows: 30})
	if err != nil {
		return nil, err
	}
	go cmd.Wait()
	return &unixTerminal{f, cmd}, nil
}
func dialAgent(ctx context.Context) (net.Conn, error) {
	path := os.Getenv("SSH_AUTH_SOCK")
	if path == "" {
		return nil, errors.New("SSH_AUTH_SOCK is not set; start your SSH agent")
	}
	return (&net.Dialer{}).DialContext(ctx, "unix", path)
}
