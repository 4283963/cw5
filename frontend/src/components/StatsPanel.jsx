import React from 'react'
import { Package, AlertTriangle, CheckCircle, TrendingUp, Wifi, WifiOff } from 'lucide-react'

export default function StatsPanel({ stats, wsConnected }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">今日处理</p>
            <p className="text-4xl font-black text-white mt-1">{stats.total}</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-sky-600 flex items-center justify-center">
            <Package className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">正常通过</p>
            <p className="text-4xl font-black text-emerald-400 mt-1">{stats.normal}</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">异常拦截</p>
            <p className="text-4xl font-black text-red-400 mt-1">{stats.anomaly}</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-red-600 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">系统状态</p>
            <p className={`text-2xl font-bold mt-1 flex items-center gap-2 ${
              wsConnected ? 'text-emerald-400' : 'text-yellow-400'
            }`}>
              {wsConnected ? '在线' : '重连中'}
              {wsConnected ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5 animate-pulse" />
              )}
            </p>
          </div>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            wsConnected ? 'bg-emerald-600' : 'bg-yellow-600 animate-pulse'
          }`}>
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
