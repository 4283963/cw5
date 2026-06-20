import React, { useState, useEffect, useCallback } from 'react'
import { Grid3x3, MapPin, X, Check, Trash2, Route as RouteIcon, RefreshCw } from 'lucide-react'
import { api } from '../services/api'

const routeColors = {
  US: { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-300', glow: 'shadow-blue-900/40' },
  UK: { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-300', glow: 'shadow-purple-900/40' },
  DE: { bg: 'bg-amber-600', border: 'border-amber-400', text: 'text-amber-300', glow: 'shadow-amber-900/40' },
  JP: { bg: 'bg-pink-600', border: 'border-pink-400', text: 'text-pink-300', glow: 'shadow-pink-900/40' },
  AU: { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-300', glow: 'shadow-emerald-900/40' },
}

function routeColor(route) {
  return routeColors[route] || { bg: 'bg-slate-600', border: 'border-slate-500', text: 'text-slate-300', glow: '' }
}

export default function SlotRoutingPanel({ refreshSignal }) {
  const [slots, setSlots] = useState([])
  const [routes, setRoutes] = useState([])
  const [availableRoutes, setAvailableRoutes] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [pickedRoute, setPickedRoute] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [slotsRes, routesRes] = await Promise.all([api.getSlots(), api.getRoutes()])
      setSlots(slotsRes.slots || [])
      setAvailableRoutes(slotsRes.available_routes || [])
      setRoutes(routesRes || [])
    } catch (e) {
      console.error('refresh slots error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, refreshSignal])

  const openSlot = (slot) => {
    setSelectedSlot(slot)
    setPickedRoute(slot.route || '')
  }

  const handleAssign = async () => {
    if (!selectedSlot || !pickedRoute) return
    setBusy(true)
    try {
      await api.assignRoute(pickedRoute, selectedSlot.slot_id)
      await refresh()
      setSelectedSlot(null)
    } catch (e) {
      alert(e.message || '分配失败')
    } finally {
      setBusy(false)
    }
  }

  const handleClearSlot = async () => {
    if (!selectedSlot) return
    setBusy(true)
    try {
      await api.clearSlot(selectedSlot.slot_id)
      await refresh()
      setSelectedSlot(null)
    } catch (e) {
      alert(e.message || '清除失败')
    } finally {
      setBusy(false)
    }
  }

  const routeMap = {}
  routes.forEach((r) => {
    routeMap[r.route] = r
  })

  return (
    <div className="bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-700">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Grid3x3 className="w-6 h-6 text-amber-400" />
          <div>
            <h3 className="text-xl font-bold text-white">格口路由配置</h3>
            <p className="text-slate-400 text-xs mt-0.5">主管操作 · 点击格口分配路向，实时同步至分拣传送带</p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {slots.map((slot) => {
          const c = routeColor(slot.route)
          const assigned = slot.status === 'assigned' && slot.route
          return (
            <button
              key={slot.slot_id}
              onClick={() => openSlot(slot)}
              className={`relative rounded-xl p-4 border-2 transition-all hover:scale-105 hover:shadow-lg ${
                assigned
                  ? `${c.bg} ${c.border} ${c.glow} shadow-lg`
                  : 'bg-slate-900 border-slate-600 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold text-lg">{slot.label}</span>
                {assigned && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </div>
              {assigned ? (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-semibold">{slot.route_name}</span>
                </div>
              ) : (
                <span className="text-slate-500 text-sm">空闲 · 点击分配</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <RouteIcon className="w-4 h-4 text-sky-400" />
          <h4 className="text-white font-semibold text-sm">当前路由表</h4>
          <span className="text-slate-500 text-xs">（路向 → 格口）</span>
        </div>
        {routes.length === 0 ? (
          <p className="text-slate-500 text-sm py-2 text-center">暂无路由配置，点击上方格口开始分配</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {routes.map((r) => {
              const c = routeColor(r.route)
              return (
                <span
                  key={r.route}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${c.bg} bg-opacity-20 border ${c.border} ${c.text} text-sm font-mono`}
                >
                  <span className="font-bold">{r.route_name}</span>
                  <span className="opacity-60">→</span>
                  <span className="font-bold">{r.slot_label || r.slot_id}</span>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {selectedSlot && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
          onClick={() => setSelectedSlot(null)}
        >
          <div
            className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-600 w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedSlot.label}</h3>
                <p className="text-slate-400 text-sm mt-1">
                  {selectedSlot.route ? `当前: ${selectedSlot.route_name}` : '当前空闲'}
                </p>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            <p className="text-slate-300 text-sm mb-3 font-semibold">选择要接收的路向</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {availableRoutes.map((r) => {
                const c = routeColor(r.route)
                const isPicked = pickedRoute === r.route
                const usedByOther = routeMap[r.route] && routeMap[r.route].slot_id !== selectedSlot.slot_id
                return (
                  <button
                    key={r.route}
                    onClick={() => setPickedRoute(r.route)}
                    className={`relative rounded-xl p-3 border-2 transition-all text-left ${
                      isPicked ? `${c.bg} ${c.border}` : 'bg-slate-900 border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <p className={`font-bold ${isPicked ? 'text-white' : 'text-slate-200'}`}>{r.name}</p>
                    <p className={`text-xs mt-0.5 ${isPicked ? 'text-white text-opacity-80' : 'text-slate-500'}`}>
                      {r.route}
                      {usedByOther && ` · 已在 ${routeMap[r.route].slot_label}`}
                    </p>
                    {isPicked && (
                      <Check className="absolute top-2 right-2 w-4 h-4 text-white" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAssign}
                disabled={!pickedRoute || busy}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
              >
                <Check className="w-5 h-5" />
                确认分配
              </button>
              {selectedSlot.route && (
                <button
                  onClick={handleClearSlot}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 px-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  清除
                </button>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-3 text-center">
              分配后立即生效，同路向包裹将自动分拣至此格口
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
