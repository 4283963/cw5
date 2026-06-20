package redis

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"

	"cw5/backend/internal/models"
)

const (
	keyRouteTable = "route:table"
	keySlotPrefix = "slot:"
)

var DefaultSlots = []models.Slot{
	{SlotID: "slot-1", Label: "格口 1"},
	{SlotID: "slot-2", Label: "格口 2"},
	{SlotID: "slot-3", Label: "格口 3"},
	{SlotID: "slot-4", Label: "格口 4"},
	{SlotID: "slot-5", Label: "格口 5"},
	{SlotID: "slot-6", Label: "格口 6"},
}

func slotKey(slotID string) string {
	return fmt.Sprintf("%s%s", keySlotPrefix, slotID)
}

func saveSlot(slot models.Slot) error {
	ctx, cancel := withTimeout()
	defer cancel()
	data, err := json.Marshal(slot)
	if err != nil {
		return err
	}
	return Client.Set(ctx, slotKey(slot.SlotID), data, 0).Err()
}

func SeedSlots() error {
	for _, s := range DefaultSlots {
		slot := models.Slot{
			SlotID:    s.SlotID,
			Label:     s.Label,
			Status:    models.SlotStatusFree,
			UpdatedAt: time.Now(),
		}
		if err := saveSlot(slot); err != nil {
			return err
		}
	}
	log.Println("Default slots seeded to Redis")
	return nil
}

func GetSlot(slotID string) (models.Slot, error) {
	ctx, cancel := withTimeout()
	defer cancel()
	data, err := Client.Get(ctx, slotKey(slotID)).Bytes()
	if err == redis.Nil {
		return models.Slot{SlotID: slotID, Label: slotID, Status: models.SlotStatusFree}, nil
	}
	if err != nil {
		return models.Slot{}, err
	}
	var slot models.Slot
	if err := json.Unmarshal(data, &slot); err != nil {
		return models.Slot{}, err
	}
	return slot, nil
}

func GetAllSlots() ([]models.Slot, error) {
	var slots []models.Slot
	for _, ds := range DefaultSlots {
		slot, err := GetSlot(ds.SlotID)
		if err != nil {
			return nil, err
		}
		if slot.Label == "" {
			slot.Label = ds.Label
		}
		slots = append(slots, slot)
	}
	return slots, nil
}

func SetRoute(route string, slotID string) error {
	ctx, cancel := withTimeout()
	defer cancel()

	oldSlotID, err := Client.HGet(ctx, keyRouteTable, route).Result()
	if err != nil && err != redis.Nil {
		return err
	}
	if oldSlotID != "" && oldSlotID != slotID {
		if oldSlot, gerr := GetSlot(oldSlotID); gerr == nil && oldSlot.SlotID != "" {
			oldSlot.Route = ""
			oldSlot.RouteName = ""
			oldSlot.Status = models.SlotStatusFree
			oldSlot.UpdatedAt = time.Now()
			_ = saveSlot(oldSlot)
		}
	}

	target, err := GetSlot(slotID)
	if err != nil {
		return err
	}
	if target.Route != "" && target.Route != route {
		_ = Client.HDel(ctx, keyRouteTable, target.Route).Err()
	}

	if err := Client.HSet(ctx, keyRouteTable, route, slotID).Err(); err != nil {
		return err
	}

	target.SlotID = slotID
	if target.Label == "" {
		for _, ds := range DefaultSlots {
			if ds.SlotID == slotID {
				target.Label = ds.Label
				break
			}
		}
	}
	target.Route = route
	target.RouteName = models.RouteNameMap[route]
	target.Status = models.SlotStatusAssigned
	target.UpdatedAt = time.Now()
	return saveSlot(target)
}

func ClearRoute(route string) error {
	ctx, cancel := withTimeout()
	defer cancel()

	slotID, err := Client.HGet(ctx, keyRouteTable, route).Result()
	if err == redis.Nil {
		return nil
	}
	if err != nil {
		return err
	}
	if err := Client.HDel(ctx, keyRouteTable, route).Err(); err != nil {
		return err
	}
	if slotID != "" {
		if slot, gerr := GetSlot(slotID); gerr == nil && slot.SlotID != "" {
			slot.Route = ""
			slot.RouteName = ""
			slot.Status = models.SlotStatusFree
			slot.UpdatedAt = time.Now()
			_ = saveSlot(slot)
		}
	}
	return nil
}

func ClearSlot(slotID string) error {
	slot, err := GetSlot(slotID)
	if err != nil {
		return err
	}
	if slot.Route != "" {
		ctx, cancel := withTimeout()
		defer cancel()
		_ = Client.HDel(ctx, keyRouteTable, slot.Route).Err()
	}
	slot.Route = ""
	slot.RouteName = ""
	slot.Status = models.SlotStatusFree
	slot.UpdatedAt = time.Now()
	return saveSlot(slot)
}

func GetRoute(route string) (string, error) {
	ctx, cancel := withTimeout()
	defer cancel()
	val, err := Client.HGet(ctx, keyRouteTable, route).Result()
	if err == redis.Nil {
		return "", nil
	}
	return val, err
}

func GetAllRoutes() ([]models.RouteRule, error) {
	ctx, cancel := withTimeout()
	defer cancel()
	mapping, err := Client.HGetAll(ctx, keyRouteTable).Result()
	if err != nil {
		return nil, err
	}
	var rules []models.RouteRule
	for route, slotID := range mapping {
		slot, _ := GetSlot(slotID)
		rules = append(rules, models.RouteRule{
			Route:     route,
			RouteName: models.RouteNameMap[route],
			SlotID:    slotID,
			SlotLabel: slot.Label,
			UpdatedAt: slot.UpdatedAt,
		})
	}
	return rules, nil
}

func ResolveSlot(destination string) (string, bool) {
	route := models.ExtractRoute(destination)
	ctx, cancel := withTimeout()
	defer cancel()
	val, err := Client.HGet(ctx, keyRouteTable, route).Result()
	if err != nil || val == "" {
		return "", false
	}
	return val, true
}
