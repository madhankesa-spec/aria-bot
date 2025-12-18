import { useEffect, useRef } from 'react'

export default function AddressGrid({ rows }) {
  const safe = Array.isArray(rows) ? rows : []
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    try {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      el.scrollTop = 0
    }
  }, [safe.length])

  const displayState = (r) => {
    const st = r?.state
    if (st?.Stt_Name && st?.Stt_Code) return `${st.Stt_Name} (${st.Stt_Code})`
    if (st?.Stt_Name) return st.Stt_Name
    if (st?.Stt_Code) return st.Stt_Code
    return r?.Add_StateName || r?.Add_State
  }

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-md">
      <div className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
        <div className="text-sm font-bold text-slate-900">Addresses <span className="text-slate-500 font-medium">({safe.length} records)</span></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200/70">
            <tr>
              <th className="px-6 py-4">Address Line 1</th>
              <th className="px-6 py-4">City</th>
              <th className="px-6 py-4">State</th>
              <th className="px-6 py-4">Zip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {safe.map((r) => (
              <tr key={r.Add_ID} className="hover:bg-blue-50/50 transition-colors group">
                <td className="px-6 py-4 text-slate-900 font-medium group-hover:text-blue-600">{r.Add_Line1}</td>
                <td className="px-6 py-4 text-slate-700 group-hover:text-blue-600">{r.Add_City}</td>
                <td className="px-6 py-4 text-slate-600 group-hover:text-blue-600">{displayState(r)}</td>
                <td className="px-6 py-4 text-slate-600 group-hover:text-blue-600 font-mono text-xs">{r.Add_Zip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
