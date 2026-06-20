import React from 'react'
import { Warehouse, Clock } from 'lucide-react'

export default function Header() {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-slate-700 px-8 py-5">
      <div className="flex items-center justify-between max-w-[1800px] mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-900/30">
            <Warehouse className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              海外仓包裹分拣操作台
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Warehouse Sorting Control System · v1.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-5 h-5" />
              <span className="font-mono text-2xl font-bold">
                {time.toLocaleTimeString('zh-CN', { hour12: false })}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              {time.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
