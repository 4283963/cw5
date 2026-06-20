package ws

import (
	"encoding/json"
	"log"
	"sync"

	"cw5/backend/internal/models"

	"github.com/gorilla/websocket"
)

type Hub struct {
	clients    map[*websocket.Conn]bool
	broadcast  chan []byte
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	mu         sync.Mutex
}

var hub = &Hub{
	clients:    make(map[*websocket.Conn]bool),
	broadcast:  make(chan []byte, 256),
	register:   make(chan *websocket.Conn),
	unregister: make(chan *websocket.Conn),
}

func GetHub() *Hub {
	return hub
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("WebSocket client connected, total: %d", len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				client.Close()
			}
			h.mu.Unlock()
			log.Printf("WebSocket client disconnected, total: %d", len(h.clients))

		case message := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				if err := client.WriteMessage(websocket.TextMessage, message); err != nil {
					log.Printf("WebSocket write error: %v", err)
					client.Close()
					delete(h.clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) RegisterClient(conn *websocket.Conn) {
	h.register <- conn
}

func (h *Hub) UnregisterClient(conn *websocket.Conn) {
	h.unregister <- conn
}

func (h *Hub) BroadcastMessage(msgType string, payload interface{}) {
	msg := models.WebSocketMessage{
		Type:    msgType,
		Payload: payload,
	}
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal WebSocket message: %v", err)
		return
	}
	h.broadcast <- data
}

func (h *Hub) BroadcastAnomaly(result *models.CheckResult) {
	h.BroadcastMessage(models.WSMessageTypeAnomaly, result)
}

func (h *Hub) BroadcastNormal(result *models.CheckResult) {
	h.BroadcastMessage(models.WSMessageTypeNormal, result)
}

func (h *Hub) BroadcastGateState(gateAction *models.GateAction) {
	h.BroadcastMessage(models.WSMessageTypeGateState, gateAction)
}

func (h *Hub) BroadcastScan(scanEvent *models.ScanEvent) {
	h.BroadcastMessage(models.WSMessageTypeScan, scanEvent)
}
