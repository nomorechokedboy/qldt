package healthz

import "context"

type HealthCheckResponse struct {
	Status string `json:"status"`
}

// HealthCheck is a liveness probe.
//
//encore:api public method=GET path=/healthz
func HealthCheck(ctx context.Context) (*HealthCheckResponse, error) {
	return &HealthCheckResponse{Status: "ok"}, nil
}
