package id

import (
	"crypto/rand"
	"encoding/base64"
)

func New(prefix string) string {
	b := make([]byte, 12)
	_, _ = rand.Read(b)
	s := base64.RawURLEncoding.EncodeToString(b)
	if prefix == "" {
		return s
	}
	return prefix + "_" + s
}

