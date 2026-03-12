package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"hisaabsay-backend/internal/auth"
	"hisaabsay-backend/internal/db"
	"hisaabsay-backend/internal/handler"
	"hisaabsay-backend/internal/store"
)

func main() {
	dbPath := envOr("DB_PATH", "hisaabsay.db")
	jwtSecret := envOr("JWT_SECRET", "dev_secret_change_me")

	d, err := db.Open(dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer func() { _ = d.Close() }()

	h := &handler.Handler{
		Store: store.New(d),
		Auth:  auth.New(jwtSecret, 30*24*time.Hour),
	}

	server := &http.Server{
		Addr:    ":8080",
		Handler: h.Routes(),
	}

	log.Println("Go API server listening on :8080")
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
