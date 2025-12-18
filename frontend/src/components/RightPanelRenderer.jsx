import ClientGrid from './ClientGrid'
import ClientForm from './ClientForm'
import AddressGrid from './AddressGrid'

import { useChatStore } from '../store/chatStore'
import { getClientAddressesById } from '../services/api'

export default function RightPanelRenderer({ panel, onClientPick }) {
  const paging = useChatStore((s) => s.clientListPaging)
  const fetchClientsPage = useChatStore((s) => s.fetchClientsPage)
  const setRightPanel = useChatStore((s) => s.setRightPanel)
  const panelBack = useChatStore((s) => s.panelBack)
  const panelHistory = useChatStore((s) => s.panelHistory)
  const handleClientPick = onClientPick
    ? onClientPick
    : (client) => {
        if (!client?.PTY_ID) return
        setRightPanel({ type: 'form', payload: { client }, title: 'Client Details' })
      }

  if (!panel || panel.type === 'empty') {
    return null
  }

  const canGoBack = (panelHistory?.index ?? 0) > 0
  const BackBar = canGoBack ? (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-xl border border-(--aria-border) bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 pl-6"
      onClick={panelBack}
    >
      Back
    </button>
  ) : null

  if (panel.type === 'grid') {
    const kind = panel?.payload?.kind
    const rows = panel?.payload?.rows || panel?.payload

    if (kind === 'addresses') {
      return (
        <div className="space-y-3">
          {BackBar}
          <AddressGrid rows={rows} />
        </div>
      )
    }
    if (kind === 'clients') {
      const page = paging?.page ?? 1
      const pageSize = paging?.pageSize ?? 10
      const canPrev = page > 1
      const canNext = Boolean(paging?.hasNext)
      return (
        <ClientGrid
          rows={rows}
          onSelect={handleClientPick}
          headerLeft={BackBar}
          pagination={{
            page,
            pageSize,
            canPrev,
            canNext,
            onPrev: canPrev ? () => fetchClientsPage(page - 1) : undefined,
            onNext: canNext ? () => fetchClientsPage(page + 1) : undefined,
          }}
        />
      )
    }

    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.Add_ID) {
      return (
        <div className="space-y-3">
          {BackBar}
          <AddressGrid rows={rows} />
        </div>
      )
    }
    if (Array.isArray(rows) && rows.length > 0 && rows[0]?.PTY_ID) {
      const page = paging?.page ?? 1
      const pageSize = paging?.pageSize ?? 10
      const canPrev = page > 1
      const canNext = Boolean(paging?.hasNext)
      return (
        <ClientGrid
          rows={rows}
          onSelect={handleClientPick}
          headerLeft={BackBar}
          pagination={{
            page,
            pageSize,
            canPrev,
            canNext,
            onPrev: canPrev ? () => fetchClientsPage(page - 1) : undefined,
            onNext: canNext ? () => fetchClientsPage(page + 1) : undefined,
          }}
        />
      )
    }

    return (
      <div className="rounded-2xl border border-dashed border-(--aria-border) bg-white/40 p-6 text-sm text-slate-600">
        Unsupported grid data
      </div>
    )
  }

  if (panel.type === 'form') {
    const payload = panel?.payload
    const c = payload?.kind === 'client_with_addresses' ? payload?.client : payload?.client || payload
    const addresses = payload?.kind === 'client_with_addresses' ? payload?.addresses : null
    return (
      <div className="space-y-3">
        {BackBar}
        <ClientForm
          client={c}
          onGetAddress={async (client) => {
            if (!client?.PTY_ID) return
            try {
              const rows = await getClientAddressesById(client.PTY_ID)
              setRightPanel({
                type: 'form',
                title: 'Client Details',
                payload: { kind: 'client_with_addresses', client, addresses: rows },
              })
            } catch (e) {
              void e
              setRightPanel({
                type: 'form',
                title: 'Client Details',
                payload: { kind: 'client_with_addresses', client, addresses: [] },
              })
            }
          }}
        />
        {Array.isArray(addresses) ? <AddressGrid rows={addresses} /> : null}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dashed border-(--aria-border) bg-white/40 p-6 text-sm text-slate-600">
      Unsupported response
    </div>
  )
}
