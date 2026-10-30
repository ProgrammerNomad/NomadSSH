package core

import (
	"os"
	"strings"
	"testing"
)

// Opt-in: uses an isolated namespace, never the user's app credentials.
func TestNativeKeychainChunkedUpdate(t *testing.T) {
	if os.Getenv("NOMADSSH_TEST_KEYCHAIN") != "1" {
		t.Skip("set NOMADSSH_TEST_KEYCHAIN=1 with an unlocked OS keychain")
	}
	store := systemSecrets{namespace: "NomadSSH-test-" + id()}
	key := "temporary-test-key"
	t.Cleanup(func() { _ = store.Delete(key) })
	original := strings.Repeat("local test secret ", 700)
	must(t, store.Set(key, original))
	got, e := store.Get(key)
	must(t, e)
	if got != original {
		t.Fatal("chunked secret differs")
	}
	must(t, store.Set(key, "replacement test secret"))
	got, e = store.Get(key)
	must(t, e)
	if got != "replacement test secret" {
		t.Fatal("replacement differs")
	}
	must(t, store.Delete(key))
	if _, e = store.Get(key); e == nil {
		t.Fatal("deleted secret readable")
	}
}
