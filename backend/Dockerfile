# Use Go 1.24 for building
FROM golang:1.24-alpine AS builder

# Install git and ca-certificates (needed for go modules and HTTPS)
RUN apk add --no-cache git ca-certificates tzdata

# Create a non-root user for building
RUN adduser -D -g '' appuser

# Set working directory
WORKDIR /build

# Copy go mod files first for better layer caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download
RUN go mod verify

# Copy source code
COPY . .

# Copy .env file if it exists (optional, since we also use Docker env vars)
COPY .env* ./

# Build the application
# CGO_ENABLED=0 for static binary, GOOS=linux for Linux target
RUN CGO_ENABLED=0 GOOS=linux go build \
    -a -installsuffix cgo \
    -ldflags='-w -s -extldflags "-static"' \
    -o app ./main.go

# Final stage: minimal runtime image
FROM scratch

# Copy ca-certificates from builder for HTTPS requests
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy user information from builder
COPY --from=builder /etc/passwd /etc/passwd

# Copy the binary from builder
COPY --from=builder --chown=appuser:appuser /build/app /app

# Copy .env file from builder (if it exists)
COPY --from=builder --chown=appuser:appuser /build/.env* ./

# Use non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/app", "--health-check"] || exit 1

# Set the entry point
ENTRYPOINT ["/app"]
