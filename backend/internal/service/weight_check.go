package service

import (
	"fmt"
	"log"
	"math"
	"time"

	"cw5/backend/internal/models"
	"cw5/backend/internal/redis"
)

const WeightTolerancePct = 10.0

type WeightCheckService struct{}

func NewWeightCheckService() *WeightCheckService {
	return &WeightCheckService{}
}

func (s *WeightCheckService) CheckWeight(trackingNumber string, actualWeight float64) (*models.CheckResult, error) {
	forecast, err := redis.GetPackageForecast(trackingNumber)
	if err != nil {
		return nil, fmt.Errorf("未找到该包裹的预报信息: %s", trackingNumber)
	}

	if actualWeight <= 0 {
		return nil, fmt.Errorf("实际重量必须大于0")
	}

	expectedWeight := forecast.ExpectedWeight
	weightDiff := actualWeight - expectedWeight
	weightDiffPct := math.Abs(weightDiff) / expectedWeight * 100

	isAnomaly := weightDiffPct > WeightTolerancePct

	var message string
	if isAnomaly {
		if weightDiff > 0 {
			message = fmt.Sprintf("重量异常: 超出预报 %.2f%%，可能多装货物", weightDiffPct)
		} else {
			message = fmt.Sprintf("重量异常: 低于预报 %.2f%%，可能漏装货物", weightDiffPct)
		}
	} else {
		message = "重量校验通过"
	}

	result := &models.CheckResult{
		TrackingNumber: trackingNumber,
		ExpectedWeight: expectedWeight,
		ActualWeight:   actualWeight,
		WeightDiff:     weightDiff,
		WeightDiffPct:  math.Round(weightDiffPct*100) / 100,
		IsAnomaly:      isAnomaly,
		Message:        message,
		OrderNo:        forecast.OrderNo,
		Destination:    forecast.Destination,
		SKU:            forecast.SKU,
		Timestamp:      time.Now(),
	}

	if err := redis.SaveCheckResult(result); err != nil {
		return nil, fmt.Errorf("保存校验结果失败: %v", err)
	}

	return result, nil
}

func (s *WeightCheckService) TriggerGate(gateID string, trackingNumber string, isAnomaly bool) (*models.GateAction, error) {
	action := models.GateActionNormal
	if isAnomaly {
		action = models.GateActionIntercept
	}

	if err := redis.SetGateState(gateID, action); err != nil {
		return nil, fmt.Errorf("设置闸口状态失败: %v", err)
	}

	gateAction := &models.GateAction{
		TrackingNumber: trackingNumber,
		GateID:         gateID,
		Action:         action,
		Timestamp:      time.Now(),
	}

	return gateAction, nil
}

func (s *WeightCheckService) ProcessPackage(trackingNumber string, actualWeight float64, fallbackGateID string) (result *models.CheckResult, gateAction *models.GateAction, err error) {
	token, ok, lerr := redis.AcquireLock(trackingNumber)
	if lerr != nil {
		return nil, nil, fmt.Errorf("获取处理锁失败: %v", lerr)
	}
	if !ok {
		return nil, nil, fmt.Errorf("包裹 %s 正在处理中，请勿重复提交", trackingNumber)
	}
	defer func() {
		if r := recover(); r != nil {
			log.Printf("panic recovered in ProcessPackage for %s: %v", trackingNumber, r)
			err = fmt.Errorf("处理包裹时发生异常: %v", r)
		}
		redis.ReleaseLock(trackingNumber, token)
	}()

	result, err = s.CheckWeight(trackingNumber, actualWeight)
	if err != nil {
		return nil, nil, err
	}

	targetSlot := fallbackGateID
	if !result.IsAnomaly {
		if slot, ok := redis.ResolveSlot(result.Destination); ok {
			targetSlot = slot
		}
	}
	result.RoutedSlot = targetSlot

	gateAction, err = s.TriggerGate(targetSlot, trackingNumber, result.IsAnomaly)
	if err != nil {
		return result, nil, err
	}

	return result, gateAction, nil
}
