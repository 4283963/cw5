import React, { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import StatsPanel from './components/StatsPanel'
import ScanPanel from './components/ScanPanel'
import PackageHistory from './components/PackageHistory'
import GateControlPanel from './components/GateControlPanel'
import SlotRoutingPanel from './components/SlotRoutingPanel'
import AnomalyModal from './components/AnomalyModal'
import { useWebSocket } from './hooks/useWebSocket'
import { api } from './services/api'

export default function App() {
  const { isConnected, subscribe } = useWebSocket()
  const [anomaly, setAnomaly] = useState(null)
  const [packages, setPackages] = useState([])
  const [checkHistory, setCheckHistory] = useState([])
  const [stats, setStats] = useState({ total: 0, normal: 0, anomaly: 0 })
  const [currentScan, setCurrentScan] = useState('')
  const [routeRefreshSignal, setRouteRefreshSignal] = useState(0)
  const [gates, setGates] = useState([
    { gate_id: 'gate-1', action: 'normal' },
    { gate_id: 'gate-2', action: 'normal' },
  ])

  const loadHistory = useCallback(async () => {
    try {
      const history = await api.getHistory()
      setCheckHistory(history)
      const total = history.length
      const anomalyCount = history.filter((h) => h.is_anomaly).length
      setStats({
        total,
        normal: total - anomalyCount,
        anomaly: anomalyCount,
      })
      const recent = await api.getRecent()
      setPackages(recent)
    } catch (e) {
      console.error('Load history error:', e)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    const unsubAnomaly = subscribe('anomaly', (payload) => {
      setAnomaly(payload)
      setCheckHistory((prev) => [payload, ...prev].slice(0, 100))
      setPackages((prev) => [
        {
          tracking_number: payload.tracking_number,
          is_anomaly: payload.is_anomaly,
          timestamp: payload.timestamp,
          weight_diff_pct: payload.weight_diff_pct,
          routed_slot: payload.routed_slot,
        },
        ...prev,
      ].slice(0, 50))
      setStats((prev) => ({
        total: prev.total + 1,
        normal: prev.normal,
        anomaly: prev.anomaly + 1,
      }))
    })

    const unsubNormal = subscribe('normal', (payload) => {
      setCheckHistory((prev) => [payload, ...prev].slice(0, 100))
      setPackages((prev) => [
        {
          tracking_number: payload.tracking_number,
          is_anomaly: payload.is_anomaly,
          timestamp: payload.timestamp,
          weight_diff_pct: payload.weight_diff_pct,
          routed_slot: payload.routed_slot,
        },
        ...prev,
      ].slice(0, 50))
      setStats((prev) => ({
        total: prev.total + 1,
        normal: prev.normal + 1,
        anomaly: prev.anomaly,
      }))
    })

    const unsubScan = subscribe('scan', (payload) => {
      setCurrentScan(payload.tracking_number)
      setTimeout(() => setCurrentScan(''), 3000)
    })

    const unsubGate = subscribe('gate_state', (payload) => {
      setGates((prev) =>
        prev.map((g) =>
          g.gate_id === payload.gate_id
            ? { ...g, action: payload.action, timestamp: payload.timestamp }
            : g
        )
      )
    })

    const unsubRoute = subscribe('route_update', () => {
      setRouteRefreshSignal((n) => n + 1)
    })

    return () => {
      unsubAnomaly()
      unsubNormal()
      unsubScan()
      unsubGate()
      unsubRoute()
    }
  }, [subscribe])

  const handleWeigh = async (trackingNumber, actualWeight) => {
    try {
      await api.weigh(trackingNumber, actualWeight)
    } catch (e) {
      alert(e.message || '处理失败')
    }
  }

  const handleControlGate = async (gateId, action) => {
    try {
      await api.controlGate(gateId, action)
    } catch (e) {
      alert(e.message || '闸口控制失败')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <main className="max-w-[1800px] mx-auto px-8 py-6 space-y-6">
        <StatsPanel stats={stats} wsConnected={isConnected} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <ScanPanel onWeigh={handleWeigh} currentScan={currentScan} />
            <GateControlPanel gates={gates} onControl={handleControlGate} />
          </div>

          <div className="lg:col-span-2">
            <PackageHistory packages={packages} />
          </div>
        </div>

        <SlotRoutingPanel refreshSignal={routeRefreshSignal} />

        <div className="bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">测试运单号（已预置预报数据）</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { tn: 'SF1234567890', w: '2.5kg', note: '正常范围' },
              { tn: 'SF1234567891', w: '1.0kg', note: '正常范围' },
              { tn: 'SF1234567892', w: '5.0kg', note: '输入6.5kg触发异常' },
              { tn: 'SF1234567893', w: '0.5kg', note: '正常范围' },
              { tn: 'SF1234567894', w: '3.2kg', note: '正常范围' },
              { tn: 'SF9999999999', w: '2.0kg', note: '输入2.8kg触发异常' },
            ].map((item) => (
              <div
                key={item.tn}
                className="bg-slate-900 rounded-lg p-3 border border-slate-700"
              >
                <p className="text-white font-mono text-sm font-bold">{item.tn}</p>
                <p className="text-slate-400 text-xs mt-1">预报: {item.w}</p>
                <p className="text-sky-400 text-xs mt-1">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <AnomalyModal anomaly={anomaly} onClose={() => setAnomaly(null)} />
    </div>
  )
}
