import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export function Table({
  columns = [],
  data = [],
  onSort,
  sortKey,
  sortDir,
  emptyMessage = 'No records found',
  emptyIcon,
  striped = false,
}) {
  const [localSort, setLocalSort] = useState({ key: null, dir: 'asc' })

  const handleSort = (col) => {
    if (!col.sortable) return
    if (onSort) {
      onSort(col.key)
    } else {
      setLocalSort(prev => ({
        key: col.key,
        dir: prev.key === col.key && prev.dir === 'asc' ? 'desc' : 'asc'
      }))
    }
  }

  const activeSort   = onSort ? { key: sortKey, dir: sortDir } : localSort
  let displayData    = [...data]

  // Client-side sorting when no external sort handler
  if (!onSort && localSort.key) {
    displayData.sort((a, b) => {
      const aVal = a[localSort.key] ?? ''
      const bVal = b[localSort.key] ?? ''
      const cmp  = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return localSort.dir === 'asc' ? cmp : -cmp
    })
  }

  return (
    <div className="table-wrapper">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => {
                const isActive = activeSort.key === col.key
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col)}
                    className={col.sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors' : ''}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && (
                        <span className="text-gray-400 dark:text-slate-500">
                          {isActive
                            ? (activeSort.dir === 'asc'
                                ? <ChevronUp size={13} className="text-primary-500" />
                                : <ChevronDown size={13} className="text-primary-500" />)
                            : <ChevronsUpDown size={13} />}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    {emptyIcon && (
                      <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                        {emptyIcon}
                      </div>
                    )}
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIdx) => (
                <tr
                  key={row.id ?? rowIdx}
                  className={striped && rowIdx % 2 === 1 ? 'bg-gray-50/60 dark:bg-slate-800/30' : ''}
                >
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(row[col.key], row, rowIdx)
                        : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table
