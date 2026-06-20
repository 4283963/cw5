import React from 'react'
import { CheckCircle, AlertTriangle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function PackageHistory({ packages }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-700">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-white">近期包裹处理记录</h3>
        <span className="text-slate-400 text-sm">共 {packages.length} 条</span>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
        {packages.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无处理记录</p>
            <p className="text-sm mt-1">扫描并称重后，记录将显示在这里</p>
          </div>
        ) : (
          packages.map((pkg, idx) => {
            const isAnomaly = pkg.is_anomaly
            const diffPct = pkg.weight_diff_pct || 0
            const diffSign = diffPct >= 0 ? '+' : ''
            return (
              <div
                key={`${pkg.tracking_number}-${idx}`}
                className={`rounded-xl p-4 border transition-all ${
                  isAnomaly
                    ? 'bg-red-950 border-red-800 hover:border-red-600'
                    : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isAnomaly ? (
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <p className={`font-mono font-bold ${isAnomaly ? 'text-red-200' : 'text-white'}`}>
                        {pkg.tracking_number}
                      </p>
                      <p className="text-xs text-slate-400">{pkg.timestamp}</p>
                      {pkg.routed_slot && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-sky-900 bg-opacity-50 border border-sky-700 text-sky-300 text-xs font-mono">
                          → {pkg.routed_slot}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">误差比例</p>
                      <p className={`font-mono font-bold flex items-center gap-1 justify-end ${
                        isAnomaly ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {diffPct > 0.1 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : diffPct < -0.1 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <Minus className="w-4 h-4" />
                        )}
                        {diffSign}{diffPct.toFixed(1)}%
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isAnomaly
                          ? 'bg-red-600 text-white'
                          : 'bg-green-600 text-white'
                      }`}
                    >
                      {isAnomaly ? '异常' : '正常'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
