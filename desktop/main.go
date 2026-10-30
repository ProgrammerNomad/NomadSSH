package main

import (
	"embed"
	"flag"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
	"io/fs"
	"log"
	"net/http"
	"nomadssh/internal/core"
	"os"
	"sync/atomic"
)

//go:embed all:frontend/dist
var assets embed.FS

type App struct {
	quitting atomic.Bool
	service  *core.Service
	app      *application.App
}

func (a *App) Invoke(request string) (string, error) { return a.service.Invoke(request) }
func (a *App) Poll() string                          { return a.service.Poll() }
func (a *App) ChooseFile() (string, error) {
	return a.app.Dialog.OpenFile().SetTitle("Choose a private key or encrypted backup").PromptForSingleSelection()
}
func (a *App) SaveFile() (string, error) {
	return a.app.Dialog.SaveFile().SetFilename("nomadssh-backup.json").PromptForSingleSelection()
}
func (a *App) ConnectDrive() error {
	url, err := a.service.BeginDriveAuth()
	if err != nil {
		return err
	}
	return a.app.Browser.OpenURL(url)
}
func main() {
	dataDir := flag.String("data-dir", "", "Separate application data directory")
	demo := flag.Bool("demo", false, "Use an isolated workspace and local SSH test server")
	flag.Parse()
	var sandbox *core.Sandbox
	if *demo {
		if *dataDir != "" {
			log.Fatal("--demo cannot use an existing data directory")
		}
		directory, err := os.MkdirTemp("", "nomadssh-demo-")
		if err != nil {
			log.Fatal(err)
		}
		*dataDir = directory
		sandbox, err = core.NewSandbox()
		if err != nil {
			log.Fatal(err)
		}
		defer sandbox.Close()
	}
	service, err := core.New(*dataDir)
	if err != nil {
		log.Fatal(err)
	}
	defer service.Close()
	if sandbox != nil {
		if err = service.ConfigureDemo(sandbox); err != nil {
			log.Fatal(err)
		}
	}
	frontend, err := fs.Sub(assets, "frontend/dist")
	if err != nil {
		log.Fatal(err)
	}
	bridge := &App{service: service}
	app := application.New(application.Options{Name: "NomadSSH", Description: "Desktop SSH client built in Go", Services: []application.Service{application.NewService(bridge)}, Assets: application.AssetOptions{Handler: http.FileServer(http.FS(frontend))}, OnShutdown: service.Close, Mac: application.MacOptions{ApplicationShouldTerminateAfterLastWindowClosed: true}})
	bridge.app = app
	bridge.installMenu()
	window := app.Window.NewWithOptions(application.WebviewWindowOptions{Title: "NomadSSH", UseApplicationMenu: true, Windows: application.WindowsWindow{Theme: application.Dark}, Width: 1360, Height: 860, MinWidth: 1000, MinHeight: 680, URL: "/", BackgroundColour: application.NewRGB(9, 12, 17)})
	window.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		if !bridge.quitting.Load() && service.HasLiveWork() {
			e.Cancel()
			app.Event.Emit("app:command", "quit")
		}
	})
	if err = app.Run(); err != nil {
		log.Fatal(err)
	}
}
