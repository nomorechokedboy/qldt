// Package config loads process-wide configuration from the environment.
package config

import (
	"log"
	"log/slog"
	"strings"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	Env           string `env:"ENV"             env-default:"dev"`
	Port          int    `env:"PORT"            env-default:"4000"`
	JWTPrivateKey string `env:"JWT_PRIVATE_KEY" env-default:"token-secret"`
	DatabaseURI   string `env:"DATABASE_URI"    env-default:"./data/local.db"`
}

var (
	_      slog.LogValuer = (*Config)(nil)
	config *Config
)

func (c *Config) LogValue() slog.Value {
	return slog.GroupValue(
		slog.String("env", c.Env),
		slog.Int("port", c.Port),
		slog.String("jwt_private_key", mask(c.JWTPrivateKey)),
		slog.String("database_uri", c.DatabaseURI),
	)
}

func mask(s string) string {
	return strings.Repeat("*", len(s))
}

func init() {
	cfg := &Config{}
	if err := cleanenv.ReadEnv(cfg); err != nil {
		log.Fatal("config: ReadEnv failed: ", err)
	}

	if cfg.Env == "dev" {
		// .env is optional in dev; ignore a missing file.
		_ = cleanenv.ReadConfig(".env", cfg)
	}

	config = cfg
}

// Get returns the singleton process configuration.
func Get() *Config {
	return config
}
