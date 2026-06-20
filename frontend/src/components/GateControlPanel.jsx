import React from 'react'
import { ArrowRight, AlertOctagon, CheckCircle, Settings } from 'lucide-react'

export default function GateControlPanel({ gates, onControl }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-700">
      <div className="flex items-center gap-3 mb-5">
        <Settings className="w-6 h-6 text-sky-400" />
        <h3 className="text-xl font-bold text-white">传送带闸口状态</h3>
      </div>

      <div className="space-y-4">
        {gates.map((gate) => {
          const isIntercept = gate.action === 'intercept'
          return (
            <div
              key={gate.gate_id}
              className={`rounded-xl p-4 border-2 transition-all ${
                isIntercept
                  ? 'bg-red-950 border-red-600 shadow-lg shadow-red-900/30'
                  : 'bg-slate-900 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isIntercept ? 'bg-red-600 animate-pulse' : 'bg-green-600'
                    }`}
                  >
                    {isIntercept ? (
                      <AlertOctagon className="w-7 h-7 text-white" />
                    ) : (
                      <CheckCircle className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{gate.gate_id.toUpperCase()}</p>
                    <p className={`text-sm ${isIntercept ? 'text-red-300' : 'text-green-300'}`}>
                      {isIntercept ? '拦截通道 - 异常包裹' : '正常通道 - 放行'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onControl(gate.gate_id, 'normal')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      !isIntercept
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-green-700 hover:text-white'
                    }`}
                  >
                    正常
                  </button>
                  <button
                    onClick={() => onControl(gate.gate_id, 'intercept')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      isIntercept
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-slate-700 text-slate-300 hover:bg-red-700 hover:text-white'
                    }`}
                  >
                    拦截
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isIntercept ? 'bg-red-500 w-full' : 'bg-green-500 w-full'
                    }`}
                    style={{
                      width: isIntercept ? '100%' : '100%',
                      background: isIntercept
                        ? 'linear-gradient(90deg, #dc2626, #ef4444, #dc2626)'
                        : 'linear-gradient(90deg, #16a34a, #22c55e, #16a34a)',
                    }}
                  />
                </div>
                <ArrowRight className={`w-5 h-5 ${isIntercept ? 'text-red-400' : 'text-green-400'}`} />
                <span className={`text-xs font-mono ${isIntercept ? 'text-red-300' : 'text-green-300'}`}>
                  {isIntercept ? '异常区' : '分拣区'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
