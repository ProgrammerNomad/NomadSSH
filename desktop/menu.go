package main

import (
	"github.com/wailsapp/wails/v3/pkg/application"
)

func (a *App) installMenu() {
	menu := application.NewMenu()
	command := func(parent *application.Menu, label, shortcut, action string) {
		item := parent.Add(label).OnClick(func(*application.Context) { a.app.Event.Emit("app:command", action) })
		if shortcut != "" {
			item.SetAccelerator(shortcut)
		}
	}
	file := menu.AddSubmenu("File")
	command(file, "New connection…", "CmdOrCtrl+N", "new")
	command(file, "Local terminal", "CmdOrCtrl+Shift+T", "local")
	file.AddSeparator()
	command(file, "Backup and sync…", "", "sync")
	command(file, "Lock workspace", "", "lock")
	file.AddSeparator()
	file.Add("Exit").OnClick(func(*application.Context) { a.requestQuit() })
	connection := menu.AddSubmenu("Connection")
	command(connection, "Connect selected host", "", "connect")
	command(connection, "Disconnect active session", "", "disconnect")
	command(connection, "Close all sessions…", "", "closeAll")
	connection.AddSeparator()
	command(connection, "Key manager…", "", "keys")
	view := menu.AddSubmenu("View")
	for _, v := range []struct{ label, action string }{{"Connections", "connections"}, {"Terminal", "terminal"}, {"SFTP files", "files"}, {"Port forwarding", "tunnels"}, {"Snippets", "snippets"}, {"Connection log", "activity"}} {
		command(view, v.label, "", v.action)
	}
	view.AddSeparator()
	command(view, "Toggle connection manager", "", "explorer")
	command(view, "Toggle split terminal", "", "split")
	command(view, "Command palette…", "", "commands")
	tools := menu.AddSubmenu("Tools")
	command(tools, "Preferences…", "CmdOrCtrl+,", "settings")
	help := menu.AddSubmenu("Help")
	command(help, "About NomadSSH", "", "about")
	a.app.Menu.Set(menu)
}

func (a *App) requestQuit() {
	if a.service.HasLiveWork() {
		a.app.Event.Emit("app:command", "quit")
		return
	}
	a.ConfirmQuit()
}

func (a *App) ConfirmQuit() { a.quitting.Store(true); a.app.Quit() }
