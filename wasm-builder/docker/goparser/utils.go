package main

import (
	"log"
	"os"
	"strconv"
)

// Returns fallback when ENV var of type String is undefined
func getEnvString(envKey, fallback string) string {
	if value, ok := os.LookupEnv(envKey); ok {
		return value
	}

	return fallback
}

// Returns fallback when ENV var of type INT is undefined
func getEnvInt(envKey string, fallback int) int {
	if value, ok := os.LookupEnv(envKey); ok {
		v, err := strconv.Atoi(value)
		if err != nil {
			log.Fatalf("GetEnvInt[%s]: %v", envKey, err)
		}
		return v
	}
	return fallback
}
