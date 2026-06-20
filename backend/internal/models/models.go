package models

import "time"

type PackageForecast struct {
	TrackingNumber string  `json:"tracking_number"`
	ExpectedWeight float64 `json:"expected_weight"`
	OrderNo        string  `json:"order_no"`
	Destination    string  `json:"destination"`
	SKU            string  `json:"sku"`
	Quantity       int     `json:"quantity"`
}

type ScanEvent struct {
	TrackingNumber string    `json:"tracking_number"`
	ScannerID      string    `json:"scanner_id"`
	Timestamp      time.Time `json:"timestamp"`
}

type WeighEvent struct {
	TrackingNumber string    `json:"tracking_number"`
	ScaleID        string    `json:"scale_id"`
	ActualWeight   float64   `json:"actual_weight"`
	Timestamp      time.Time `json:"timestamp"`
}

type CheckResult struct {
	TrackingNumber string    `json:"tracking_number"`
	ExpectedWeight float64   `json:"expected_weight"`
	ActualWeight   float64   `json:"actual_weight"`
	WeightDiff     float64   `json:"weight_diff"`
	WeightDiffPct  float64   `json:"weight_diff_pct"`
	IsAnomaly      bool      `json:"is_anomaly"`
	Message        string    `json:"message"`
	OrderNo        string    `json:"order_no"`
	Destination    string    `json:"destination"`
	SKU            string    `json:"sku"`
	Timestamp      time.Time `json:"timestamp"`
}

type GateAction struct {
	TrackingNumber string    `json:"tracking_number"`
	GateID         string    `json:"gate_id"`
	Action         string    `json:"action"`
	Timestamp      time.Time `json:"timestamp"`
}

const (
	GateActionNormal    = "normal"
	GateActionIntercept = "intercept"
)

type WebSocketMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

const (
	WSMessageTypeAnomaly   = "anomaly"
	WSMessageTypeNormal    = "normal"
	WSMessageTypeGateState = "gate_state"
	WSMessageTypeScan      = "scan"
)
