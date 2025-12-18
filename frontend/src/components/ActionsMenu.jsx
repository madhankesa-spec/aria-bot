export default function ActionsMenu({ items }) {
  const list = Array.isArray(items) ? items : []
  if (list.length === 0) return null

  return (
    <div className="-mx-4 border-t border-slate-200  px-4 py-3 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl">
        <div className="space-y-2">
          {list.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={it.onClick}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              <span className="truncate">{it.label}</span>
              <span className="text-slate-400">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
