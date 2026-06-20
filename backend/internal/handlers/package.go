package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"cw5/backend/internal/models"
	"cw5/backend/internal/redis"
	"cw5/backend/internal/service"
	"cw5/backend/internal/ws"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type PackageHandler struct {
	weightService *service.WeightCheckService
}

func NewPackageHandler() *PackageHandler {
	return &PackageHandler{
		weightService: service.NewWeightCheckService(),
	}
}

func (h *PackageHandler) WebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to upgrade WebSocket"})
		return
	}
	hub := ws.GetHub()
	hub.RegisterClient(conn)
	defer hub.UnregisterClient(conn)

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

type ScanRequest struct {
	TrackingNumber string `json:"tracking_number" binding:"required"`
	ScannerID      string `json:"scanner_id"`
}

func (h *PackageHandler) HandleScan(c *gin.Context) {
	var req ScanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	scanEvent := &models.ScanEvent{
		TrackingNumber: req.TrackingNumber,
		ScannerID:      req.ScannerID,
		Timestamp:      time.Now(),
	}

	hub := ws.GetHub()
	hub.BroadcastScan(scanEvent)

	c.JSON(http.StatusOK, gin.H{
		"message": "Scan recorded",
		"scan":    scanEvent,
	})
}

type WeighRequest struct {
	TrackingNumber string  `json:"tracking_number" binding:"required"`
	ActualWeight   float64 `json:"actual_weight" binding:"required,gt=0"`
	ScaleID        string  `json:"scale_id"`
	GateID         string  `json:"gate_id"`
}

func (h *PackageHandler) HandleWeigh(c *gin.Context) {
	var req WeighRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	gateID := req.GateID
	if gateID == "" {
		gateID = "gate-1"
	}

	result, gateAction, err := h.weightService.ProcessPackage(req.TrackingNumber, req.ActualWeight, gateID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	hub := ws.GetHub()
	if result.IsAnomaly {
		hub.BroadcastAnomaly(result)
	} else {
		hub.BroadcastNormal(result)
	}
	hub.BroadcastGateState(gateAction)

	c.JSON(http.StatusOK, gin.H{
		"check_result": result,
		"gate_action":  gateAction,
	})
}

type ForecastRequest struct {
	TrackingNumber string  `json:"tracking_number" binding:"required"`
	ExpectedWeight float64 `json:"expected_weight" binding:"required,gt=0"`
	OrderNo        string  `json:"order_no"`
	Destination    string  `json:"destination"`
	SKU            string  `json:"sku"`
	Quantity       int     `json:"quantity"`
}

func (h *PackageHandler) CreateForecast(c *gin.Context) {
	var req ForecastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	forecast := &models.PackageForecast{
		TrackingNumber: req.TrackingNumber,
		ExpectedWeight: req.ExpectedWeight,
		OrderNo:        req.OrderNo,
		Destination:    req.Destination,
		SKU:            req.SKU,
		Quantity:       req.Quantity,
	}

	if err := redis.SavePackageForecast(forecast); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save forecast"})
		return
	}

	c.JSON(http.StatusCreated, forecast)
}

func (h *PackageHandler) GetForecast(c *gin.Context) {
	trackingNumber := c.Param("tracking_number")
	if trackingNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tracking number is required"})
		return
	}

	forecast, err := redis.GetPackageForecast(trackingNumber)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, forecast)
}

func (h *PackageHandler) GetCheckHistory(c *gin.Context) {
	history, err := redis.GetCheckHistory(50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch history"})
		return
	}
	c.JSON(http.StatusOK, history)
}

func (h *PackageHandler) GetRecentPackages(c *gin.Context) {
	packages, err := redis.GetRecentPackages(50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recent packages"})
		return
	}
	c.JSON(http.StatusOK, packages)
}

type GateRequest struct {
	GateID         string `json:"gate_id" binding:"required"`
	Action         string `json:"action" binding:"required,oneof=normal intercept"`
	TrackingNumber string `json:"tracking_number"`
}

func (h *PackageHandler) ControlGate(c *gin.Context) {
	var req GateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if err := redis.SetGateState(req.GateID, req.Action); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to control gate"})
		return
	}

	gateAction := &models.GateAction{
		TrackingNumber: req.TrackingNumber,
		GateID:         req.GateID,
		Action:         req.Action,
		Timestamp:      time.Now(),
	}

	hub := ws.GetHub()
	hub.BroadcastGateState(gateAction)

	c.JSON(http.StatusOK, gateAction)
}

func (h *PackageHandler) GetGateState(c *gin.Context) {
	gateID := c.Param("gate_id")
	if gateID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gate ID is required"})
		return
	}

	state, err := redis.GetGateState(gateID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get gate state"})
		return
	}

	c.JSON(http.StatusOK, state)
}

func (h *PackageHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "warehouse-sorting-middleware",
		"time":    time.Now().Format(time.RFC3339),
	})
}
