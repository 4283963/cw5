import { useEffect, useRef, useCallback, useState } from 'react'

const WS_URL = 'ws://localhost:8080/ws'

export function useWebSocket() {
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const listenersRef = useRef(new Map())

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WS] Connected')
        setIsConnected(true)
      }

      ws.onclose = () => {
        console.log('[WS] Disconnected, retrying in 3s...')
        setIsConnected(false)
        setTimeout(connect, 3000)
      }

      ws.onerror = (err) => {
        console.error('[WS] Error:', err)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          setLastMessage({ ...msg, receivedAt: Date.now() })
          const callback = listenersRef.current.get(msg.type)
          if (callback) callback(msg.payload)
        } catch (e) {
          console.error('[WS] Parse error:', e)
        }
      }
    } catch (e) {
      console.error('[WS] Connection failed:', e)
      setTimeout(connect, 3000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const subscribe = useCallback((type, callback) => {
    listenersRef.current.set(type, callback)
    return () => listenersRef.current.delete(type)
  }, [])

  return { isConnected, lastMessage, subscribe }
}
