import { useMemo, useState } from 'react'
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  ComposedChart,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
  ReferenceLine, Brush, LabelList, Cell
} from 'recharts'

// ─── Shared Palette (matches mandatory color spec) ───
const PALETTE = {
  primary:  '#4f46e5',   // Indigo-600 — sales/revenue
  accent:   '#3b82f6',   // Blue-500  — forecast/secondary
  success:  '#22c55e',   // Green-500 — revenue/in-stock
  warning:  '#eab308',   // Yellow-500 — low stock
  danger:   '#ef4444',   // Red-500   — out of stock
  muted:    '#94a3b8',   // slate-400 — averages/ref lines
  grid:     '#f1f5f9',   // light grid
  gridDark: '#1e293b',   // dark grid
}

// Friendly number formatter
const fmt = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })

// ─── SHARED TOOLTIP STYLE ───
const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
  padding: '10px 14px',
  fontSize: 13,
}

const darkTooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  padding: '10px 14px',
  fontSize: 13,
  color: '#f1f5f9',
}

// Detect dark mode
const isDark = () => document.documentElement.classList.contains('dark')

function getTooltipStyle() {
  return isDark() ? darkTooltipStyle : tooltipStyle
}

// ─── CHART FILTER BUTTONS ───
function ChartFilterBtn({ options, active, onChange, colorClass = 'bg-primary-600' }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
            active === opt.key
              ? `${colorClass} text-white shadow-sm`
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── REVENUE CHART ───
export function RevenueChart({ data = [] }) {
  const [window, setWindow] = useState('all')

  const normalized = useMemo(() => {
    return (Array.isArray(data) ? data : []).map((item, i) => ({
      label:   item?.date || item?.month || item?.label || `M${i + 1}`,
      revenue: Number(item?.revenue ?? item?.value ?? item?.total_revenue ?? 0) || 0,
    }))
  }, [data])

  const filtered = useMemo(() => {
    if (window === 'all') return normalized
    return normalized.slice(-Number(window))
  }, [normalized, window])

  const chartData = filtered.length ? filtered : [{ label: 'No Data', revenue: 0 }]
  const values    = chartData.map(d => d.revenue)
  const avg       = values.reduce((s, v) => s + v, 0) / (values.length || 1)
  const peak      = Math.max(...values, 0)

  return (
    <div className="h-72 relative">
      <div className="absolute right-0 -top-8 z-10">
        <ChartFilterBtn
          options={[{ key: '6', label: '6M' }, { key: '12', label: '12M' }, { key: 'all', label: 'All' }]}
          active={window}
          onChange={setWindow}
        />
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={PALETTE.primary} stopOpacity={0.20} />
              <stop offset="95%" stopColor={PALETTE.primary} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark() ? PALETTE.gridDark : PALETTE.grid} vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis
            axisLine={false} tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(v) => `₹${fmt(v)}`}
            width={60}
          />
          <Tooltip
            contentStyle={getTooltipStyle()}
            formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
            labelFormatter={(l) => `Period: ${l}`}
          />
          <ReferenceLine y={avg} stroke={PALETTE.muted} strokeDasharray="5 4"
            label={{ value: 'Avg', fontSize: 10, fill: PALETTE.muted, position: 'insideTopRight' }} />
          <Area type="monotone" dataKey="revenue" stroke="none" fill="url(#revGrad)" />
          <Line
            type="monotone" dataKey="revenue"
            stroke={PALETTE.primary} strokeWidth={2.5}
            dot={{ fill: PALETTE.primary, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: PALETTE.primary, strokeWidth: 2, stroke: '#fff' }}
          />
          {chartData.length > 8 && <Brush dataKey="label" height={16} stroke={PALETTE.primary} fill="transparent" travellerWidth={6} />}
        </AreaChart>
      </ResponsiveContainer>

      <div className="absolute left-0 -bottom-1 flex gap-2 text-xs">
        <span className="px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-medium">
          Peak ₹{peak.toLocaleString()}
        </span>
        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-medium">
          Avg ₹{Math.round(avg).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

// ─── DEMAND FORECAST CHART ───
export function DemandForecastChart({ data = [] }) {
  const [mode, setMode] = useState('bar')

  const chartData = useMemo(() => {
    const source = Array.isArray(data) ? data : []
    const normalized = source.map((item, i) => {
      const forecast = Number(item?.forecast ?? item?.revenue ?? item?.value ?? 0)
      return {
        label:          item?.month || item?.date || `M${i + 1}`,
        forecast:       Number.isFinite(forecast) ? forecast : 0,
        confidenceLow:  Math.max(0, Math.round(forecast * 0.88)),
        confidenceHigh: Math.round(forecast * 1.12),
      }
    })
    return normalized.length ? normalized : [{ label: 'No Data', forecast: 0, confidenceLow: 0, confidenceHigh: 0 }]
  }, [data])

  const avg = chartData.reduce((s, d) => s + d.forecast, 0) / (chartData.length || 1)

  return (
    <div className="h-72 relative">
      <div className="absolute right-0 -top-8 z-10">
        <ChartFilterBtn
          options={[{ key: 'bar', label: 'Bars' }, { key: 'line', label: 'Trend' }]}
          active={mode}
          onChange={setMode}
          colorClass="bg-accent-600"
        />
      </div>

      <ResponsiveContainer width="100%" height="100%">
        {mode === 'bar' ? (
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark() ? PALETTE.gridDark : PALETTE.grid} vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmt} width={50} />
            <Tooltip contentStyle={getTooltipStyle()} formatter={(v) => [Number(v).toLocaleString(), 'Forecast']} />
            <ReferenceLine y={avg} stroke={PALETTE.muted} strokeDasharray="5 4"
              label={{ value: 'Avg', fontSize: 10, fill: PALETTE.muted, position: 'insideTopRight' }} />
            <Bar dataKey="forecast" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.forecast >= avg ? PALETTE.accent : '#93c5fd'}
                />
              ))}
            </Bar>
            {chartData.length > 8 && <Brush dataKey="label" height={16} stroke={PALETTE.accent} fill="transparent" travellerWidth={6} />}
          </BarChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark() ? PALETTE.gridDark : PALETTE.grid} vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmt} width={50} />
            <Tooltip contentStyle={getTooltipStyle()} formatter={(v, name) => [Number(v).toLocaleString(), name]} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Line type="monotone" dataKey="confidenceLow"  stroke="#bfdbfe" strokeDasharray="4 3" dot={false} name="Low Band" />
            <Line type="monotone" dataKey="confidenceHigh" stroke="#93c5fd" strokeDasharray="4 3" dot={false} name="High Band" />
            <Line
              type="monotone" dataKey="forecast"
              stroke={PALETTE.accent} strokeWidth={2.5}
              dot={{ fill: PALETTE.accent, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: PALETTE.accent, strokeWidth: 2, stroke: '#fff' }}
              name="Forecast"
            />
            {chartData.length > 8 && <Brush dataKey="label" height={16} stroke={PALETTE.accent} fill="transparent" travellerWidth={6} />}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

// ─── INVENTORY TREND CHART ───
export function InventoryTrendChart({ data = [] }) {
  const [visible, setVisible] = useState({ inStock: true, lowStock: true, outOfStock: true })

  const chartData = useMemo(() => {
    const src = Array.isArray(data) ? data : []
    const normalized = src.map((item, i) => ({
      label:       item?.month || item?.date || item?.label || `P${i + 1}`,
      inStock:     Number(item?.inStock || 0),
      lowStock:    Number(item?.lowStock || 0),
      outOfStock:  Number(item?.outOfStock || 0),
    }))
    return normalized.length ? normalized : [{ label: 'Current', inStock: 0, lowStock: 0, outOfStock: 0 }]
  }, [data])

  const latest  = chartData[chartData.length - 1]
  const total   = (latest.inStock || 0) + (latest.lowStock || 0) + (latest.outOfStock || 0)
  const riskPct = total > 0 ? (((latest.lowStock || 0) + (latest.outOfStock || 0)) / total) * 100 : 0

  const toggleBtn = (key, label, color) => (
    <button
      onClick={() => setVisible(p => ({ ...p, [key]: !p[key] }))}
      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
        visible[key] ? `${color} text-white shadow-sm` : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="h-72 relative">
      <div className="absolute right-0 -top-8 z-10">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
          {toggleBtn('inStock',    'In Stock', 'bg-success-600')}
          {toggleBtn('lowStock',   'Low',      'bg-warning-500')}
          {toggleBtn('outOfStock', 'Out',      'bg-danger-600')}
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke={isDark() ? PALETTE.gridDark : PALETTE.grid} vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} width={40} />
          <Tooltip
            contentStyle={getTooltipStyle()}
            formatter={(v) => [`${Number(v || 0).toLocaleString()} items`]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          {visible.inStock    && <Bar dataKey="inStock"    fill={PALETTE.success} radius={[5,5,0,0]} name="In Stock"    maxBarSize={48}>
            <LabelList dataKey="inStock"    position="top" fill={PALETTE.success} fontSize={10} formatter={v => v > 0 ? fmt(v) : ''} />
          </Bar>}
          {visible.lowStock   && <Bar dataKey="lowStock"   fill={PALETTE.warning} radius={[5,5,0,0]} name="Low Stock"   maxBarSize={48}>
            <LabelList dataKey="lowStock"   position="top" fill={PALETTE.warning} fontSize={10} formatter={v => v > 0 ? fmt(v) : ''} />
          </Bar>}
          {visible.outOfStock && <Bar dataKey="outOfStock" fill={PALETTE.danger}  radius={[5,5,0,0]} name="Out of Stock" maxBarSize={48}>
            <LabelList dataKey="outOfStock" position="top" fill={PALETTE.danger}  fontSize={10} formatter={v => v > 0 ? fmt(v) : ''} />
          </Bar>}
          {chartData.length > 8 && <Brush dataKey="label" height={16} stroke={PALETTE.success} fill="transparent" travellerWidth={6} />}
        </BarChart>
      </ResponsiveContainer>

      <div className={`absolute left-0 -bottom-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
        riskPct > 20
          ? 'bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
          : 'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400'
      }`}>
        Risk Index: {riskPct.toFixed(1)}%
      </div>
    </div>
  )
}

// ─── SALES CHART ───
export function SalesChart({ data = [] }) {
  const [window, setWindow] = useState('7')

  const normalized = useMemo(() => {
    const src = (Array.isArray(data) ? data : []).map((item, i) => ({
      label: item?.day || item?.date || item?.label || `D${i + 1}`,
      sales: Number(item?.sales ?? item?.amount ?? item?.value ?? 0),
    }))
    let running = 0
    return src.map(d => { running += d.sales; return { ...d, cumulative: running } })
  }, [data])

  const filtered = useMemo(() => {
    if (window === 'all') return normalized
    return normalized.slice(-Number(window))
  }, [normalized, window])

  const chartData = filtered.length ? filtered : [{ label: 'No Data', sales: 0, cumulative: 0 }]
  const avg = chartData.reduce((s, d) => s + d.sales, 0) / (chartData.length || 1)

  return (
    <div className="h-72 relative">
      <div className="absolute right-0 -top-8 z-10">
        <ChartFilterBtn
          options={[{ key: '7', label: '7D' }, { key: '30', label: '30D' }, { key: 'all', label: 'All' }]}
          active={window}
          onChange={setWindow}
        />
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark() ? PALETTE.gridDark : PALETTE.grid} vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${fmt(v)}`} width={60} />
          <Tooltip
            contentStyle={getTooltipStyle()}
            formatter={(v, name) => [`₹${Number(v).toLocaleString()}`, name === 'cumulative' ? 'Cumulative' : 'Sales']}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          <ReferenceLine y={avg} stroke={PALETTE.muted} strokeDasharray="5 4"
            label={{ value: 'Avg', fontSize: 10, fill: PALETTE.muted, position: 'insideTopRight' }} />
          <Bar dataKey="sales" fill={PALETTE.primary} radius={[5, 5, 0, 0]} name="Sales" maxBarSize={40} opacity={0.9} />
          <Line
            type="monotone" dataKey="cumulative"
            stroke={PALETTE.success} strokeWidth={2.5}
            dot={false} name="Cumulative"
          />
          {chartData.length > 8 && <Brush dataKey="label" height={16} stroke={PALETTE.primary} fill="transparent" travellerWidth={6} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
