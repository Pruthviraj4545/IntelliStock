import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, Brush, Legend } from 'recharts'
import { motion } from 'framer-motion'

function ForecastChart({ data, title = "Demand Forecast" }) {
  const [mode, setMode] = useState('area')

  const normalizedData = Array.isArray(data)
    ? data
        .map((item, index) => {
          const label = item?.month || item?.date || item?.label || `Day ${index + 1}`
          const forecastValue = Number(item?.forecast ?? item?.revenue ?? item?.value ?? 0)
          return {
            label,
            forecast: Number.isFinite(forecastValue) ? forecastValue : 0,
            confidenceLow: Math.max(0, Math.round((Number.isFinite(forecastValue) ? forecastValue : 0) * 0.9)),
            confidenceHigh: Math.round((Number.isFinite(forecastValue) ? forecastValue : 0) * 1.1)
          }
        })
        .filter((item) => item.label)
    : []

  const chartData = normalizedData.length > 0 ? normalizedData : [{ label: 'No Data', forecast: 0 }]
  const avgForecast = useMemo(() => {
    if (chartData.length === 0) return 0
    return chartData.reduce((sum, item) => sum + Number(item.forecast || 0), 0) / chartData.length
  }, [chartData])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">AI-powered demand prediction</p>
      </div>

      <div className="h-80 relative">
        <div className="absolute right-0 top-0 z-10 flex items-center gap-1 rounded-lg bg-white/90 px-1 py-1 shadow-sm border border-slate-200">
          <button
            onClick={() => setMode('area')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${mode === 'area' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Area
          </button>
          <button
            onClick={() => setMode('line')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${mode === 'line' ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Band
          </button>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          {mode === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 28, right: 12, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value) => [Number(value || 0).toLocaleString(), 'Predicted Demand']}
              />
              <ReferenceLine y={avgForecast} stroke="#94a3b8" strokeDasharray="6 6" label={{ value: 'Avg', fill: '#64748b', fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#forecastGradient)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              />
              {chartData.length > 8 && <Brush dataKey="label" height={18} stroke="#8b5cf6" travellerWidth={8} />}
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 28, right: 12, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value) => [Number(value || 0).toLocaleString(), 'Forecast Band']}
              />
              <Legend />
              <Line type="monotone" dataKey="confidenceLow" stroke="#ddd6fe" dot={false} name="Low Band" />
              <Line type="monotone" dataKey="confidenceHigh" stroke="#a78bfa" dot={false} name="High Band" />
              <Line type="monotone" dataKey="forecast" stroke="#6d28d9" strokeWidth={3} dot={{ r: 3 }} name="Forecast" />
              {chartData.length > 8 && <Brush dataKey="label" height={18} stroke="#8b5cf6" travellerWidth={8} />}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* AI Confidence Indicator */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-600">AI Confidence:</span>
        <div className="flex items-center space-x-2">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="w-4/5 h-full bg-gradient-to-r from-accent-500 to-accent-600 rounded-full"></div>
          </div>
          <span className="font-medium text-accent-600">85%</span>
        </div>
      </div>
    </motion.div>
  )
}

export default ForecastChart