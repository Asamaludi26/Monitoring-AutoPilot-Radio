package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[worker-go] No .env file found, using system env")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("[worker-go] DATABASE_URL is required")
	}

	pollIntervalStr := os.Getenv("GO_WORKER_POLL_INTERVAL_SEC")
	pollInterval := 30 * time.Second
	if pollIntervalStr != "" {
		if d, err := time.ParseDuration(pollIntervalStr + "s"); err == nil {
			pollInterval = d
		}
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Graceful shutdown
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	log.Printf("[worker-go] SNMP Polling Service started — interval: %v", pollInterval)

	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			log.Println("[worker-go] Poll cycle started")
			// TODO: poller.PollAll(ctx)
		case <-sigCh:
			log.Println("[worker-go] Shutdown signal received")
			cancel()
			return
		case <-ctx.Done():
			return
		}
	}
}
