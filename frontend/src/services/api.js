const API_BASE = 'http://localhost:8080/api/v1'

export async function apiRequest(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  health: () => apiRequest('/health'),

  scan: (trackingNumber, scannerId = 'scanner-001') =>
    apiRequest('/scan', {
      method: 'POST',
      body: JSON.stringify({ tracking_number: trackingNumber, scanner_id: scannerId }),
    }),

  weigh: (trackingNumber, actualWeight, scaleId = 'scale-001', gateId = 'gate-1') =>
    apiRequest('/weigh', {
      method: 'POST',
      body: JSON.stringify({
        tracking_number: trackingNumber,
        actual_weight: actualWeight,
        scale_id: scaleId,
        gate_id: gateId,
      }),
    }),

  createForecast: (data) =>
    apiRequest('/packages/forecast', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getForecast: (trackingNumber) =>
    apiRequest(`/packages/forecast/${trackingNumber}`),

  getHistory: () => apiRequest('/packages/history'),

  getRecent: () => apiRequest('/packages/recent'),

  controlGate: (gateId, action, trackingNumber = '') =>
    apiRequest('/gates/control', {
      method: 'POST',
      body: JSON.stringify({ gate_id: gateId, action, tracking_number: trackingNumber }),
    }),

  getGateState: (gateId) => apiRequest(`/gates/state/${gateId}`),

  getSlots: () => apiRequest('/slots'),

  getRoutes: () => apiRequest('/routing'),

  assignRoute: (route, slotId) =>
    apiRequest('/routing/assign', {
      method: 'POST',
      body: JSON.stringify({ route, slot_id: slotId }),
    }),

  clearRoute: (route) =>
    apiRequest(`/routing/route/${route}`, { method: 'DELETE' }),

  clearSlot: (slotId) =>
    apiRequest(`/slots/${slotId}`, { method: 'DELETE' }),
}
