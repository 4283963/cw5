import React, { useState, useRef, useEffect } from 'react'
import { Scan, Package } from 'lucide-react'

export default function ScanPanel({ onScan, onWeigh, currentScan }) {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [weight, setWeight] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (currentScan) {
      setTrackingNumber(currentScan)
    }
  }, [currentScan])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (trackingNumber.trim() && weight) {
      const w = parseFloat(weight)
      if (w > 0) {
        onWeigh(trackingNumber.trim(), w)
        setTrackingNumber('')
        setWeight('')
        inputRef.current?.focus()
      }
    }
  }

  const simulateScan = () => {
    const samples = [
      { tn: 'SF1234567890', w: '2.45' },
      { tn: 'SF1234567891', w: '1.15' },
      { tn: 'SF1234567892', w: '6.50' },
      { tn: 'SF1234567893', w: '0.48' },
      { tn: 'SF1234567894', w: '3.15' },
      { tn: 'SF9999999999', w: '2.80' },
    ]
    const sample = samples[Math.floor(Math.random() * samples.length)]
    setTrackingNumber(sample.tn)
    setWeight(sample.w)
    setIsScanning(true)
    setTimeout(() => setIsScanning(false), 800)
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <Scan className="w-7 h-7 text-emerald-400" />
        <h3 className="text-2xl font-bold text-white">扫描 & 称重区</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-slate-300 text-sm mb-2 font-semibold">条码扫描</label>
          <div className={`relative overflow-hidden rounded-xl ${isScanning ? 'scan-line' : ''}`}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="请扫描或输入运单号..."
              className="w-full bg-slate-900 border-2 border-slate-600 focus:border-emerald-500 rounded-xl py-4 pl-14 pr-4 text-white text-xl font-mono outline-none transition-colors placeholder:text-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 text-sm mb-2 font-semibold">重量 (kg)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="请输入实际称重..."
            className="w-full bg-slate-900 border-2 border-slate-600 focus:border-emerald-500 rounded-xl py-4 px-4 text-white text-2xl font-bold font-mono outline-none transition-colors placeholder:text-slate-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!trackingNumber.trim() || !weight || parseFloat(weight) <= 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl transition-colors shadow-lg shadow-emerald-900/30"
          >
            提交校验
          </button>
          <button
            type="button"
            onClick={simulateScan}
            className="px-6 bg-sky-600 hover:bg-sky-500 text-white text-lg font-bold py-4 rounded-xl transition-colors"
          >
            模拟扫描
          </button>
        </div>
      </form>
    </div>
  )
}
