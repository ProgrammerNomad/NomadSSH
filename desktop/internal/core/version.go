package core

// Version can be set by the release build using -ldflags -X.
var Version = "0.2.0-dev"

func (s *Service) HasLiveWork() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, session := range s.sessions {
		status := session.Info().Status
		if status == "connected" || status == "connecting" {
			return true
		}
	}
	for _, transfer := range s.transfers {
		status := transfer.Info().Status
		if status == "queued" || status == "transferring" {
			return true
		}
	}
	return len(s.forwards) > 0
}
