//go:build windows

package core

import (
	"fmt"
	"golang.org/x/sys/windows"
	"io"
	"os"
)

func lockWorkspace(path string) (io.Closer, error) {
	file, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return nil, err
	}
	var overlap windows.Overlapped
	if err = windows.LockFileEx(windows.Handle(file.Fd()), windows.LOCKFILE_EXCLUSIVE_LOCK|windows.LOCKFILE_FAIL_IMMEDIATELY, 0, 1, 0, &overlap); err != nil {
		file.Close()
		return nil, fmt.Errorf("Workspace is already open in another instance or cannot be locked: %w", err)
	}
	return file, nil
}
