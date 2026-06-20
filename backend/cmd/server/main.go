package main

import (
	"log"

	"cw5/backend/internal/config"
	"cw5/backend/internal/redis"
	"cw5/backend/internal/routes"
	"cw5/backend/internal/ws"
)

func main() {
	config.Load()
	redis.Init()

	if err := redis.SeedMockForecastData(); err != nil {
		log.Printf("Warning: Failed to seed mock data: %v", err)
	}

	hub := ws.GetHub()
	go hub.Run()

	r := routes.Setup()

	log.Printf("Server starting on port %s", config.AppConfig.Port)
	if err := r.Run(":" + config.AppConfig.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
