package ws

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"cw5/backend/internal/config"
	"cw5/backend/internal/models"

	"github.com/gorilla/websocket"
)

const (
	clientSendBuf     = 64
	broadcastSendWait = 500 * time.Millisecond
	pingInterval      = 30 * time.Second
)

type Client struct {
	conn *websocket.Conn
	send chan []byte
	hub  *Hub
}

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

var hub = &Hub{
	clients:    make(map[*Client]bool),
	broadcast:  make(chan []byte, 256),
	register:   make(chan *Client, 16),
	unregister: make(chan *Client, 16),
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
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("WebSocket client disconnected, total: %d", len(h.clients))

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					log.Printf("WebSocket client send buffer full, dropping slow client")
					go func(c *Client) { c.hub.unregister <- c }(client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) ServeWebSocket(conn *websocket.Conn) {
	client := &Client{
		conn: conn,
		send: make(chan []byte, clientSendBuf),
		hub:  h,
	}

	h.register <- client

	go client.writePump()
	client.readPump()
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingInterval)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(config.AppConfig.WSWriteTimeout))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(config.AppConfig.WSWriteTimeout))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(config.AppConfig.WSReadTimeout))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(config.AppConfig.WSReadTimeout))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}
		c.conn.SetReadDeadline(time.Now().Add(config.AppConfig.WSReadTimeout))
	}
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
	select {
	case h.broadcast <- data:
	case <-time.After(broadcastSendWait):
		log.Printf("Warning: broadcast channel full, dropping message type=%s", msgType)
	}
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
