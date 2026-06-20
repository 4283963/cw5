package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"

	"cw5/backend/internal/config"
	"cw5/backend/internal/models"
)

var (
	Client *redis.Client
	ctx    = context.Background()
)

const (
	keyPackageForecast = "pkg:forecast:%s"
	keyCheckHistory    = "pkg:check:history"
	keyGateState       = "gate:state:%s"
	keyGateHistory     = "gate:history"
	keyRecentPackages  = "pkg:recent"
)

func Init() {
	Client = redis.NewClient(&redis.Options{
		Addr:     config.AppConfig.RedisAddr,
		Password: config.AppConfig.RedisPassword,
		DB:       config.AppConfig.RedisDB,
	})

	if err := Client.Ping(ctx).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("Connected to Redis successfully")
}

func SavePackageForecast(pkg *models.PackageForecast) error {
	key := fmt.Sprintf(keyPackageForecast, pkg.TrackingNumber)
	data, err := json.Marshal(pkg)
	if err != nil {
		return err
	}
	return Client.Set(ctx, key, data, 24*time.Hour).Err()
}

func GetPackageForecast(trackingNumber string) (*models.PackageForecast, error) {
	key := fmt.Sprintf(keyPackageForecast, trackingNumber)
	data, err := Client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, fmt.Errorf("package forecast not found for tracking number: %s", trackingNumber)
	}
	if err != nil {
		return nil, err
	}
	var pkg models.PackageForecast
	if err := json.Unmarshal(data, &pkg); err != nil {
		return nil, err
	}
	return &pkg, nil
}

func SaveCheckResult(result *models.CheckResult) error {
	data, err := json.Marshal(result)
	if err != nil {
		return err
	}
	if err := Client.LPush(ctx, keyCheckHistory, data).Err(); err != nil {
		return err
	}
	Client.LTrim(ctx, keyCheckHistory, 0, 99)

	entry := map[string]interface{}{
		"tracking_number": result.TrackingNumber,
		"is_anomaly":      result.IsAnomaly,
		"timestamp":       result.Timestamp.Format(time.RFC3339),
		"weight_diff_pct": result.WeightDiffPct,
	}
	entryData, _ := json.Marshal(entry)
	Client.LPush(ctx, keyRecentPackages, entryData)
	Client.LTrim(ctx, keyRecentPackages, 0, 49)
	return nil
}

func GetCheckHistory(limit int64) ([]*models.CheckResult, error) {
	if limit <= 0 {
		limit = 20
	}
	results, err := Client.LRange(ctx, keyCheckHistory, 0, limit-1).Result()
	if err != nil {
		return nil, err
	}
	var checkResults []*models.CheckResult
	for _, r := range results {
		var cr models.CheckResult
		if err := json.Unmarshal([]byte(r), &cr); err != nil {
			continue
		}
		checkResults = append(checkResults, &cr)
	}
	return checkResults, nil
}

func SetGateState(gateID string, action string) error {
	key := fmt.Sprintf(keyGateState, gateID)
	state := map[string]interface{}{
		"gate_id":   gateID,
		"action":    action,
		"timestamp": time.Now().Format(time.RFC3339),
	}
	data, err := json.Marshal(state)
	if err != nil {
		return err
	}
	if err := Client.Set(ctx, key, data, 0).Err(); err != nil {
		return err
	}
	return Client.LPush(ctx, keyGateHistory, data).Err()
}

func GetGateState(gateID string) (map[string]interface{}, error) {
	key := fmt.Sprintf(keyGateState, gateID)
	data, err := Client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return map[string]interface{}{
			"gate_id": gateID,
			"action":  models.GateActionNormal,
		}, nil
	}
	if err != nil {
		return nil, err
	}
	var state map[string]interface{}
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, err
	}
	return state, nil
}

func GetRecentPackages(limit int64) ([]map[string]interface{}, error) {
	if limit <= 0 {
		limit = 20
	}
	results, err := Client.LRange(ctx, keyRecentPackages, 0, limit-1).Result()
	if err != nil {
		return nil, err
	}
	var packages []map[string]interface{}
	for _, r := range results {
		var p map[string]interface{}
		if err := json.Unmarshal([]byte(r), &p); err != nil {
			continue
		}
		packages = append(packages, p)
	}
	return packages, nil
}

func SeedMockForecastData() error {
	mockData := []*models.PackageForecast{
		{TrackingNumber: "SF1234567890", ExpectedWeight: 2.5, OrderNo: "ORD2024001", Destination: "US-LAX", SKU: "SKU-A001", Quantity: 2},
		{TrackingNumber: "SF1234567891", ExpectedWeight: 1.0, OrderNo: "ORD2024002", Destination: "UK-LON", SKU: "SKU-B002", Quantity: 1},
		{TrackingNumber: "SF1234567892", ExpectedWeight: 5.0, OrderNo: "ORD2024003", Destination: "DE-FRA", SKU: "SKU-C003", Quantity: 5},
		{TrackingNumber: "SF1234567893", ExpectedWeight: 0.5, OrderNo: "ORD2024004", Destination: "JP-TYO", SKU: "SKU-D004", Quantity: 1},
		{TrackingNumber: "SF1234567894", ExpectedWeight: 3.2, OrderNo: "ORD2024005", Destination: "AU-SYD", SKU: "SKU-E005", Quantity: 3},
		{TrackingNumber: "SF9999999999", ExpectedWeight: 2.0, OrderNo: "ORD2024006", Destination: "US-NYC", SKU: "SKU-F006", Quantity: 2},
	}

	for _, pkg := range mockData {
		if err := SavePackageForecast(pkg); err != nil {
			return err
		}
	}
	log.Println("Mock forecast data seeded to Redis")
	return nil
}
