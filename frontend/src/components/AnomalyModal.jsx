import React, { useEffect, useRef } from 'react'
import { AlertTriangle, X, Scale, Package, MapPin, ShoppingBag } from 'lucide-react'

export default function AnomalyModal({ anomaly, onClose }) {
  const audioRef = useRef(null)

  useEffect(() => {
    if (anomaly && audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
  }, [anomaly])

  if (!anomaly) return null

  const diffSign = anomaly.weight_diff >= 0 ? '+' : ''
  const isOverweight = anomaly.weight_diff >= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YVAAAAAgAAAAaHd7dnRzdHd5eHx/gYGEioyOkJCRkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==" type="audio/wav" />
      </audio>

      <div className="relative w-full max-w-2xl mx-4 shake-animation">
        <div className="absolute -inset-2 bg-red-600 rounded-3xl opacity-75 animate-ping" />
        <div className="relative bg-gradient-to-br from-red-700 via-red-600 to-red-800 rounded-2xl shadow-2xl border-4 border-red-400 alarm-pulse">
          <div className="flex items-center justify-between p-6 border-b border-red-500 bg-red-900 bg-opacity-50 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center animate-pulse-fast">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-white tracking-wider">异常拦截</h2>
                <p className="text-red-200 text-lg mt-1">ANOMALY DETECTED - 请立即处理</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-red-200" />
                  <div>
                    <p className="text-red-200 text-sm">运单号</p>
                    <p className="text-white font-mono text-xl font-bold">{anomaly.tracking_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-red-200" />
                  <div>
                    <p className="text-red-200 text-sm">订单号</p>
                    <p className="text-white font-mono text-xl font-bold">{anomaly.order_no}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-red-200" />
                  <div>
                    <p className="text-red-200 text-sm">目的地</p>
                    <p className="text-white text-xl font-bold">{anomaly.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-red-200" />
                  <div>
                    <p className="text-red-200 text-sm">SKU</p>
                    <p className="text-white font-mono text-xl font-bold">{anomaly.sku}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-950 rounded-xl p-5">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-red-300 text-sm mb-1">预报重量</p>
                  <p className="text-white text-3xl font-bold">{anomaly.expected_weight.toFixed(2)}</p>
                  <p className="text-red-300 text-xs">kg</p>
                </div>
                <div className="text-center border-x border-red-700">
                  <p className="text-red-300 text-sm mb-1">实际重量</p>
                  <p className={`text-3xl font-bold ${isOverweight ? 'text-yellow-300' : 'text-orange-300'}`}>
                    {anomaly.actual_weight.toFixed(2)}
                  </p>
                  <p className="text-red-300 text-xs">kg</p>
                </div>
                <div className="text-center">
                  <p className="text-red-300 text-sm mb-1">误差比例</p>
                  <p className="text-yellow-300 text-3xl font-black">
                    {diffSign}{anomaly.weight_diff_pct.toFixed(1)}%
                  </p>
                  <p className="text-red-300 text-xs">阈值 10%</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500 bg-opacity-20 border-2 border-yellow-400 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-100 font-bold text-lg">⚠ {anomaly.message}</p>
                  <p className="text-yellow-200 text-sm mt-1">
                    传送带闸口已切换至拦截通道，请检查包裹内货物是否正确。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white text-xl font-bold py-4 rounded-xl transition-colors"
              >
                确认并关闭
              </button>
              <button
                className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xl font-bold py-4 rounded-xl transition-colors border-2 border-white border-opacity-30"
              >
                转人工复核
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
