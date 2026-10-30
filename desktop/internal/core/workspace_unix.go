//go:build !windows

package core

import (
	"fmt"
	"golang.org/x/sys/unix"
	"io"
	"os"
)

func lockWorkspace(path string) (io.Closer, error) {
	file, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return nil, err
	}
	if err = unix.Flock(int(file.Fd()), unix.LOCK_EX|unix.LOCK_NB); err != nil {
		file.Close()
		return nil, fmt.Errorf("Workspace is already open in another instance or cannot be locked: %w", err)
	}
	return file, nil
}
