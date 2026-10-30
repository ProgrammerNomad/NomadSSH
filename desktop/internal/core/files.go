package core

import (
	"bytes"
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"github.com/pkg/sftp"
	"io"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

type FileInfo struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	Size        int64  `json:"size"`
	Directory   bool   `json:"directory"`
	Symlink     bool   `json:"symlink"`
	Modified    string `json:"modified"`
	Permissions string `json:"permissions"`
}
type Listing struct {
	Path   string     `json:"path"`
	Parent string     `json:"parent"`
	Files  []FileInfo `json:"files"`
}

func (s *Service) sftpClient(sessionID string) (*sftp.Client, error) {
	v, err := s.session(sessionID)
	if err != nil {
		return nil, err
	}
	v.mu.Lock()
	client := v.client
	status := v.info.Status
	v.mu.Unlock()
	if client == nil || status != "connected" {
		return nil, errors.New("Select a connected SSH session")
	}
	return sftp.NewClient(client)
}
func (s *Service) listFiles(r Request) (Listing, error) {
	var items []os.FileInfo
	var err error
	dir := r.Path
	parent := ""
	join := filepath.Join
	if r.Remote {
		client, err := s.sftpClient(r.ID)
		if err != nil {
			return Listing{}, err
		}
		defer client.Close()
		if dir == "" {
			dir = "."
		}
		dir, err = client.RealPath(dir)
		if err != nil {
			return Listing{}, err
		}
		items, err = client.ReadDir(dir)
		if err != nil {
			return Listing{}, err
		}
		parent = path.Dir(dir)
		join = path.Join
	} else {
		if dir == "" {
			dir = homeDir()
		}
		dir, err = filepath.Abs(dir)
		if err != nil {
			return Listing{}, err
		}
		entries, e := os.ReadDir(dir)
		if e != nil {
			return Listing{}, e
		}
		for _, entry := range entries {
			info, e := entry.Info()
			if e == nil {
				items = append(items, info)
			}
		}
		parent = filepath.Dir(dir)
	}
	result := Listing{Path: dir, Parent: parent, Files: []FileInfo{}}
	for _, i := range items {
		result.Files = append(result.Files, FileInfo{i.Name(), join(dir, i.Name()), i.Size(), i.IsDir(), i.Mode()&os.ModeSymlink != 0, i.ModTime().Format(time.RFC3339), i.Mode().String()})
	}
	sort.Slice(result.Files, func(i, j int) bool {
		if result.Files[i].Directory != result.Files[j].Directory {
			return result.Files[i].Directory
		}
		return result.Files[i].Name < result.Files[j].Name
	})
	return result, nil
}
func (s *Service) fileAction(r Request) error {
	if r.Path == "" || r.Path == "/" || filepath.Clean(r.Path) == filepath.VolumeName(r.Path)+string(filepath.Separator) {
		return errors.New("Choose a file or directory, not a filesystem root")
	}
	if r.Remote {
		c, err := s.sftpClient(r.ID)
		if err != nil {
			return err
		}
		defer c.Close()
		switch r.Type {
		case "mkdir":
			return c.Mkdir(r.Path)
		case "rename":
			return c.Rename(r.Path, r.Destination)
		case "delete":
			i, e := c.Lstat(r.Path)
			if e != nil {
				return e
			}
			if i.IsDir() {
				return c.RemoveDirectory(r.Path)
			}
			return c.Remove(r.Path)
		case "chmod":
			mode, e := strconv.ParseUint(r.Mode, 8, 12)
			if e != nil || mode > 0777 {
				return errors.New("Permissions must be octal, from 000 to 777")
			}
			return c.Chmod(r.Path, os.FileMode(mode))
		}
	} else {
		switch r.Type {
		case "mkdir":
			return os.Mkdir(r.Path, 0755)
		case "rename":
			return os.Rename(r.Path, r.Destination)
		case "delete":
			return os.Remove(r.Path)
		}
	}
	return errors.New("Unsupported file operation")
}

type TransferInfo struct {
	ID          string `json:"id"`
	SessionID   string `json:"sessionId"`
	Name        string `json:"name"`
	Source      string `json:"source"`
	Destination string `json:"destination"`
	Direction   string `json:"direction"`
	Status      string `json:"status"`
	Bytes       int64  `json:"bytes"`
	Total       int64  `json:"total"`
	Speed       int64  `json:"speed"`
	Error       string `json:"error"`
}
type Transfer struct {
	mu      sync.Mutex
	info    TransferInfo
	cancel  context.CancelFunc
	started time.Time
	request Request
	paused  bool
}

func (t *Transfer) Info() TransferInfo { t.mu.Lock(); defer t.mu.Unlock(); return t.info }

var transferSlots = make(chan struct{}, 3)

func (s *Service) startTransfer(r Request) (TransferInfo, error) {
	if r.Path == "" || r.Destination == "" {
		return TransferInfo{}, errors.New("Source and destination paths are required")
	}
	v, err := s.session(r.ID)
	if err != nil {
		return TransferInfo{}, err
	}
	if v.Info().Status != "connected" || v.Info().Local {
		return TransferInfo{}, errors.New("Select a connected SSH session")
	}
	ctx, cancel := context.WithCancel(v.ctx)
	direction := "upload"
	if r.Remote {
		direction = "download"
	}
	t := &Transfer{info: TransferInfo{ID: id(), SessionID: r.ID, Name: filepath.Base(r.Path), Source: r.Path, Destination: r.Destination, Direction: direction, Status: "queued"}, cancel: cancel, started: time.Now(), request: r}
	s.mu.Lock()
	s.transfers[t.info.ID] = t
	s.mu.Unlock()
	go func() {
		defer cancel()
		select {
		case transferSlots <- struct{}{}:
			defer func() { <-transferSlots }()
		case <-ctx.Done():
			t.mu.Lock()
			paused := t.paused
			t.mu.Unlock()
			status := "cancelled"
			if paused {
				status = "paused"
			}
			t.finish(status, nil)
			return
		}
		t.mu.Lock()
		t.info.Status = "transferring"
		t.mu.Unlock()
		err := s.copyTransfer(ctx, t, r)
		if ctx.Err() != nil {
			t.mu.Lock()
			paused := t.paused
			t.mu.Unlock()
			status := "cancelled"
			if paused {
				status = "paused"
			}
			t.finish(status, nil)
		} else if err != nil {
			t.finish("error", err)
		} else {
			t.finish("completed", nil)
		}
		s.emit(Event{"transfer", t.info.ID, t.Info()})
	}()
	return t.Info(), nil
}
func (t *Transfer) finish(status string, err error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.info.Status = status
	if err != nil {
		t.info.Error = err.Error()
	}
}

// Each resume validates the existing prefix before appending. Symlinks are never traversed.
func (s *Service) copyTransfer(ctx context.Context, t *Transfer, r Request) error {
	c, err := s.sftpClient(r.ID)
	if err != nil {
		return err
	}
	defer c.Close()
	stop := context.AfterFunc(ctx, func() { c.Close() })
	defer stop()
	type item struct {
		source, dest string
		info         os.FileInfo
	}
	var files []item
	var dirs []string
	var total int64
	stat := os.Lstat
	readDir := func(p string) ([]os.FileInfo, error) {
		entries, e := os.ReadDir(p)
		if e != nil {
			return nil, e
		}
		result := []os.FileInfo{}
		for _, entry := range entries {
			i, e := entry.Info()
			if e != nil {
				return nil, e
			}
			result = append(result, i)
		}
		return result, nil
	}
	sourceJoin := filepath.Join
	destJoin := path.Join
	if r.Remote {
		stat = c.Lstat
		readDir = c.ReadDir
		sourceJoin = path.Join
		destJoin = filepath.Join
	}
	var walk func(string, string, int) error
	walk = func(src, dst string, depth int) error {
		if err := ctx.Err(); err != nil {
			return err
		}
		if depth > 64 || len(files)+len(dirs) > 100000 {
			return errors.New("Directory tree exceeds transfer limits")
		}
		info, err := stat(src)
		if err != nil {
			return err
		}
		if info.Mode()&os.ModeSymlink != 0 {
			return fmt.Errorf("Symlinks are not followed: %s", src)
		}
		if info.IsDir() {
			dirs = append(dirs, dst)
			entries, err := readDir(src)
			if err != nil {
				return err
			}
			for _, entry := range entries {
				name := entry.Name()
				if name == "." || name == ".." || strings.ContainsAny(name, "/\\") {
					return errors.New("Unsafe directory entry")
				}
				if err = walk(sourceJoin(src, name), destJoin(dst, name), depth+1); err != nil {
					return err
				}
			}
			return nil
		}
		if !info.Mode().IsRegular() {
			return fmt.Errorf("Not a regular file: %s", src)
		}
		files = append(files, item{src, dst, info})
		total += info.Size()
		return nil
	}
	if err = walk(r.Path, r.Destination, 0); err != nil {
		return err
	}
	t.mu.Lock()
	t.info.Total = total
	t.mu.Unlock()
	for _, dir := range dirs {
		if err = ctx.Err(); err != nil {
			return err
		}
		var info os.FileInfo
		if r.Remote {
			info, err = os.Lstat(dir)
		} else {
			info, err = c.Lstat(dir)
		}
		if err == nil {
			if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
				return fmt.Errorf("Destination is not a directory: %s", dir)
			}
			if r.Mode != "resume" && r.Mode != "overwrite" {
				return fmt.Errorf("Destination already exists: %s", dir)
			}
			continue
		}
		if !os.IsNotExist(err) {
			return err
		}
		if r.Remote {
			err = os.Mkdir(dir, 0700)
		} else {
			err = c.Mkdir(dir)
		}
		if err != nil {
			return err
		}
	}
	for _, f := range files {
		if err = s.copyFile(ctx, c, t, Request{Path: f.source, Destination: f.dest, Remote: r.Remote, Mode: r.Mode}, f.info); err != nil {
			return err
		}
	}
	return nil
}
func (s *Service) copyFile(ctx context.Context, c *sftp.Client, t *Transfer, r Request, info os.FileInfo) error {
	var source io.ReadSeekCloser
	var dest io.WriteCloser
	var err error
	if r.Remote {
		source, err = c.Open(r.Path)
	} else {
		source, err = os.Open(r.Path)
	}
	if err != nil {
		return err
	}
	defer source.Close()
	var existing os.FileInfo
	if r.Remote {
		existing, err = os.Lstat(r.Destination)
	} else {
		existing, err = c.Lstat(r.Destination)
	}
	exists := err == nil
	if err != nil && !os.IsNotExist(err) {
		return err
	}
	if exists && !existing.Mode().IsRegular() {
		return errors.New("Destination must be a regular file, not a symlink or directory")
	}
	offset := int64(0)
	flags := os.O_WRONLY | os.O_CREATE | os.O_EXCL
	if r.Mode == "overwrite" {
		flags = os.O_WRONLY | os.O_CREATE | os.O_TRUNC
	}
	if r.Mode == "resume" && exists {
		offset = existing.Size()
		if offset > info.Size() {
			return errors.New("Destination is larger than source; choose a new destination")
		}
		var prefix io.ReadCloser
		if r.Remote {
			prefix, err = os.Open(r.Destination)
		} else {
			prefix, err = c.Open(r.Destination)
		}
		if err != nil {
			return err
		}
		left, right := sha256.New(), sha256.New()
		_, err = io.CopyN(left, source, offset)
		if err == nil {
			_, err = io.CopyN(right, prefix, offset)
		}
		prefix.Close()
		if err != nil {
			return err
		}
		if !bytes.Equal(left.Sum(nil), right.Sum(nil)) {
			return errors.New("Existing destination does not match source; resume refused")
		}
		flags = os.O_WRONLY | os.O_APPEND
	}
	if err = ctx.Err(); err != nil {
		return err
	}
	if r.Remote {
		dest, err = os.OpenFile(r.Destination, flags, 0600)
	} else {
		dest, err = c.OpenFile(r.Destination, flags)
	}
	if err != nil {
		return err
	}
	defer dest.Close()
	t.mu.Lock()
	t.info.Bytes += offset
	t.mu.Unlock()
	copied := offset
	buffer := make([]byte, 128*1024)
	for {
		if err = ctx.Err(); err != nil {
			return err
		}
		n, readErr := source.Read(buffer)
		if n > 0 {
			written, writeErr := dest.Write(buffer[:n])
			copied += int64(written)
			t.mu.Lock()
			t.info.Bytes += int64(written)
			seconds := time.Since(t.started).Seconds()
			if seconds > 0 {
				t.info.Speed = int64(float64(t.info.Bytes) / seconds)
			}
			t.mu.Unlock()
			if writeErr != nil {
				return writeErr
			}
			if written != n {
				return io.ErrShortWrite
			}
		}
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return readErr
		}
	}
	if copied != info.Size() {
		return fmt.Errorf("Source changed while copying; expected %d bytes", info.Size())
	}
	return dest.Close()
}
func (s *Service) controlTransfer(r Request) (any, error) {
	s.mu.Lock()
	t := s.transfers[r.ID]
	s.mu.Unlock()
	if t == nil {
		return nil, errors.New("Transfer not found")
	}
	t.mu.Lock()
	status := t.info.Status
	request := t.request
	if r.Op == "pauseTransfer" {
		t.paused = true
	}
	t.mu.Unlock()
	if r.Op == "pauseTransfer" || r.Op == "cancelTransfer" {
		t.cancel()
		return true, nil
	}
	if status == "queued" || status == "transferring" {
		return nil, errors.New("Transfer is still active")
	}
	request.Mode = "resume"
	return s.startTransfer(request)
}
