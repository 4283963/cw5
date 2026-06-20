package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	RedisAddr      string
	RedisPassword  string
	RedisDB        int
	AllowedOrigins string

	RedisOpTimeout   time.Duration
	RedisLockTimeout time.Duration
	WSWriteTimeout   time.Duration
	WSReadTimeout    time.Duration
}

var AppConfig *Config

func Load() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found, using environment variables: %v", err)
	}

	AppConfig = &Config{
		Port:             getEnv("PORT", "8080"),
		RedisAddr:        getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword:    getEnv("REDIS_PASSWORD", ""),
		RedisDB:          getEnvInt("REDIS_DB", 0),
		AllowedOrigins:   getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		RedisOpTimeout:   getEnvDuration("REDIS_OP_TIMEOUT", 3*time.Second),
		RedisLockTimeout: getEnvDuration("REDIS_LOCK_TIMEOUT", 10*time.Second),
		WSWriteTimeout:   getEnvDuration("WS_WRITE_TIMEOUT", 10*time.Second),
		WSReadTimeout:    getEnvDuration("WS_READ_TIMEOUT", 60*time.Second),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value, exists := os.LookupEnv(key); exists {
		if v, err := strconv.Atoi(value); err == nil {
			return v
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value, exists := os.LookupEnv(key); exists {
		if v, err := time.ParseDuration(value); err == nil {
			return v
		}
	}
	return defaultValue
}
