package utils

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"

	"golang.org/x/crypto/argon2"
)

type PasswordConfig struct {
	Memory      uint32
	Iterations  uint32
	Parallelism uint8
	SaltLength  uint32
	KeyLength   uint32
}

func DefaultPasswordConfig() *PasswordConfig {
	return &PasswordConfig{
		Memory:      64 * 1024,
		Iterations:  3,
		Parallelism: 2,
		SaltLength:  16,
		KeyLength:   32,
	}
}

func GenerateSalt(length uint32) ([]byte, error) {
	salt := make([]byte, length)
	_, err := rand.Read(salt)
	if err != nil {
		return nil, err
	}
	return salt, nil
}

func HashPassword(password string, config *PasswordConfig) (string, error) {
	salt, err := GenerateSalt(config.SaltLength)
	if err != nil {
		return "", err
	}

	hash := argon2.IDKey([]byte(password), salt, config.Iterations, config.Memory, config.Parallelism, config.KeyLength)

	// Encode the salt and hash to base64
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	// Return encoded password
	encodedHash := fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, config.Memory, config.Iterations, config.Parallelism, b64Salt, b64Hash)

	return encodedHash, nil
}

func VerifyPassword(password, encodedHash string) (bool, error) {
	vals, salt, hash, err := decodeHash(encodedHash)
	if err != nil {
		return false, err
	}

	otherHash := argon2.IDKey([]byte(password), salt, vals.Iterations, vals.Memory, vals.Parallelism, vals.KeyLength)

	return subtle.ConstantTimeCompare(hash, otherHash) == 1, nil
}

func decodeHash(encodedHash string) (config *PasswordConfig, salt, hash []byte, err error) {
	vals := &PasswordConfig{}
	var version int

	_, err = fmt.Sscanf(encodedHash, "$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s", &version, &vals.Memory, &vals.Iterations, &vals.Parallelism, &vals, &vals)
	if err != nil {
		return nil, nil, nil, err
	}

	if version != argon2.Version {
		return nil, nil, nil, errors.New("incompatible version of argon2")
	}

	// Extract base64 encoded salt and hash
	parts := make([]string, 6)
	n, err := fmt.Sscanf(encodedHash, "$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		&version, &vals.Memory, &vals.Iterations, &vals.Parallelism, &parts[4], &parts[5])
	if err != nil || n != 6 {
		return nil, nil, nil, errors.New("invalid hash format")
	}

	salt, err = base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return nil, nil, nil, err
	}
	vals.SaltLength = uint32(len(salt))

	hash, err = base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return nil, nil, nil, err
	}
	vals.KeyLength = uint32(len(hash))

	return vals, salt, hash, nil
}

func GenerateRandomToken(length int) (string, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// GenerateRecoveryCode generates a human-readable recovery code like "ABCD-1234"
func GenerateRecoveryCode() (string, error) {
	// Generate 4 uppercase letters
	letters := make([]byte, 4)
	_, err := rand.Read(letters)
	if err != nil {
		return "", err
	}

	// Convert to uppercase letters A-Z
	for i := range letters {
		letters[i] = 'A' + (letters[i] % 26)
	}

	// Generate 4 digits
	digits := make([]byte, 4)
	_, err = rand.Read(digits)
	if err != nil {
		return "", err
	}

	// Convert to digits 0-9
	for i := range digits {
		digits[i] = '0' + (digits[i] % 10)
	}

	return fmt.Sprintf("%s-%s", string(letters), string(digits)), nil
}

// GenerateRecoveryCodes generates a set of recovery codes for a user
func GenerateRecoveryCodes(count int) ([]string, error) {
	codes := make([]string, count)
	for i := 0; i < count; i++ {
		code, err := GenerateRecoveryCode()
		if err != nil {
			return nil, err
		}
		codes[i] = code
	}
	return codes, nil
}
