//go:build windows

package core

import (
	"context"
	"github.com/Microsoft/go-winio"
	"github.com/UserExistsError/conpty"
	"net"
	"os"
	"os/exec"
)

func startTerminal() (terminal, error) {
	shell, err := exec.LookPath("pwsh.exe")
	if err != nil {
		shell, err = exec.LookPath("powershell.exe")
	}
	args := " -NoLogo"
	if err != nil {
		shell = os.Getenv("COMSPEC")
		args = ""
	}
	return conpty.Start(`"`+shell+`"`+args, conpty.ConPtyDimensions(120, 30), conpty.ConPtyWorkDir(homeDir()))
}
func dialAgent(ctx context.Context) (net.Conn, error) {
	return winio.DialPipeContext(ctx, `\\.\pipe\openssh-ssh-agent`)
}
