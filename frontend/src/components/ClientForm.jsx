import { useMemo } from 'react'

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/50 px-4 py-3 hover:border-slate-300 transition-colors">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value || '—'}</div>
    </div>
  )
}

export default function ClientForm({ client, onGetAddress }) {
  const c = client || {}
  const fullName = useMemo(() => {
    const a = [c.PTY_FirstName, c.PTY_LastName].filter(Boolean).join(' ')
    return a || 'Client'
  }, [c.PTY_FirstName, c.PTY_LastName])

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-md">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-bold text-slate-900">Client Details</div>
          <div className="text-sm text-slate-600 mt-1">{fullName}</div>
        </div>
        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2 text-sm font-semibold text-white hover:shadow-md hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          onClick={() => onGetAddress?.(c)}
          disabled={!c?.PTY_ID}
          title={c?.PTY_ID ? 'Fetch addresses for this client' : 'No client selected'}
        >
          Get Addresses
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="First Name" value={c.PTY_FirstName} />
        <Field label="Last Name" value={c.PTY_LastName} />
        <Field label="Phone" value={c.PTY_Phone} />
        <Field label="SSN" value={c.PTY_SSN} />
        <Field label="Client ID" value={c.PTY_ID} />
      </div>
    </div>
  )
}
