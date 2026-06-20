package models

import (
	"strings"
	"time"
)

type Slot struct {
	SlotID    string    `json:"slot_id"`
	Label     string    `json:"label"`
	Route     string    `json:"route"`
	RouteName string    `json:"route_name"`
	Status    string    `json:"status"`
	UpdatedAt time.Time `json:"updated_at"`
}

const (
	SlotStatusFree     = "free"
	SlotStatusAssigned = "assigned"
)

type RouteRule struct {
	Route     string    `json:"route"`
	RouteName string    `json:"route_name"`
	SlotID    string    `json:"slot_id"`
	SlotLabel string    `json:"slot_label"`
	UpdatedAt time.Time `json:"updated_at"`
}

type RouteOption struct {
	Route string `json:"route"`
	Name  string `json:"name"`
}

var AvailableRoutes = []RouteOption{
	{Route: "US", Name: "美国路向"},
	{Route: "UK", Name: "英国路向"},
	{Route: "DE", Name: "德国路向"},
	{Route: "JP", Name: "日本路向"},
	{Route: "AU", Name: "澳洲路向"},
}

var RouteNameMap = map[string]string{
	"US": "美国路向",
	"UK": "英国路向",
	"DE": "德国路向",
	"JP": "日本路向",
	"AU": "澳洲路向",
}

func ExtractRoute(destination string) string {
	if idx := strings.Index(destination, "-"); idx > 0 {
		return destination[:idx]
	}
	return destination
}
