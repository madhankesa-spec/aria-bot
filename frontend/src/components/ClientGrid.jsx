import { useEffect, useRef } from 'react'

export default function ClientGrid({ rows, onSelect, pagination, headerLeft }) {
  const safe = Array.isArray(rows) ? rows : []
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? safe.length
  const canPrev = Boolean(pagination?.canPrev)
  const canNext = Boolean(pagination?.canNext)
  const onPrev = pagination?.onPrev
  const onNext = pagination?.onNext

  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    try {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      el.scrollTop = 0
    }
  }, [safe.length, page])

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-md">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
        <div className="flex items-center gap-3">
          {headerLeft ? <div className="shrink-0">{headerLeft}</div> : null}
          <div className="text-sm font-bold text-slate-900">Clients</div>
          <div className="text-xs text-slate-500 font-medium">({safe.length} records)</div>
        </div>
        {pagination ? (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={onPrev}
              disabled={!canPrev}
            >
              ← Prev
            </button>
            <div className="min-w-20 text-center font-semibold text-slate-700">
              Page {page}
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={onNext}
              disabled={!canNext}
            >
              Next →
            </button>
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200/70">
            <tr>
              <th className="px-6 py-4">First Name</th>
              <th className="px-6 py-4">Last Name</th>
              <th className="px-6 py-4">Phone</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {safe.map((r) => (
              <tr
                key={r.PTY_ID}
                className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
                onClick={() => onSelect?.(r)}
              >
                <td className="px-6 py-4 text-slate-900 font-medium group-hover:text-blue-600">{r.PTY_FirstName}</td>
                <td className="px-6 py-4 text-slate-700 group-hover:text-blue-600">{r.PTY_LastName}</td>
                <td className="px-6 py-4 text-slate-600 group-hover:text-blue-600 font-mono text-xs">{r.PTY_Phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50 px-6 py-3 text-xs text-slate-600">
          <div className="font-medium">
            Showing {safe.length} results
          </div>
          <div className="text-slate-500">Offset: {(page - 1) * pageSize}</div>
        </div>
      ) : null}
    </div>
  )
}
