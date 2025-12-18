import { create } from 'zustand'

import { getClients } from '../services/api'
import { translateText } from '../services/translate'

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useChatStore = create((set, get) => ({
  messages: [],
  rightPanel: { type: 'empty', payload: null, title: null },
  panelHistory: { items: [{ type: 'empty', payload: null, title: null }], index: 0 },
  status: { sending: false, error: null },
  selectedClientId: null,
  clientListPaging: { page: 1, pageSize: 10, hasNext: false },
  addMessage: (role, content, meta) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: nowId(),
          role,
          content,
          ts: Date.now(),
          meta: {
            ...(meta || {}),
            // Preserve a stable source to enable re-translation on language switch.
            original: (meta && meta.original) || content,
            originalLang: (meta && meta.originalLang) || 'en',
          },
        },
      ],
    })),
  setRightPanel: (panel) =>
    set((s) => {
      const base = panel || { type: 'empty', payload: null, title: null }
      const items = s.panelHistory.items.slice(0, s.panelHistory.index + 1)
      items.push(base)
      return { rightPanel: base, panelHistory: { items, index: items.length - 1 } }
    }),
  panelBack: () =>
    set((s) => {
      const nextIndex = Math.max(0, s.panelHistory.index - 1)
      const panel = s.panelHistory.items[nextIndex] || { type: 'empty', payload: null, title: null }
      return { rightPanel: panel, panelHistory: { ...s.panelHistory, index: nextIndex } }
    }),
  panelForward: () =>
    set((s) => {
      const nextIndex = Math.min(s.panelHistory.items.length - 1, s.panelHistory.index + 1)
      const panel = s.panelHistory.items[nextIndex] || { type: 'empty', payload: null, title: null }
      return { rightPanel: panel, panelHistory: { ...s.panelHistory, index: nextIndex } }
    }),
  setSending: (sending) => set((s) => ({ status: { ...s.status, sending } })),
  setError: (error) => set((s) => ({ status: { ...s.status, error } })),
  setSelectedClientId: (id) => set({ selectedClientId: id }),
  resetClientListPaging: () => set({ clientListPaging: { page: 1, pageSize: 10, hasNext: false } }),
  fetchClientsPage: async (page = 1) => {
    const pageSize = get().clientListPaging.pageSize || 10
    const offset = Math.max(0, (page - 1) * pageSize)

    const rows = await getClients({ limit: pageSize + 1, offset })
    const safeRows = Array.isArray(rows) ? rows : []
    const hasNext = safeRows.length > pageSize

    const pageRows = hasNext ? safeRows.slice(0, pageSize) : safeRows
    set({ clientListPaging: { page, pageSize, hasNext } })
    get().setRightPanel({ type: 'grid', title: 'Clients', payload: { kind: 'clients', rows: pageRows } })
  },
  hydrateFromResponse: (resp) => {
    if (!resp) return
    const { type, reply, payload } = resp
    // The backend may return replies already translated to the user's selected language.
    // Store the reply as the stable "original" and tag it with the current UI language so
    // translateAllMessages can re-translate from that source later.
    if (reply) {
      const uiLang = String(window?.__ariaLang || '').trim() || 'en'
      get().addMessage('assistant', reply, { original: reply, originalLang: uiLang })
    }
    if (type === 'grid' || type === 'form') {
      // If it's a clients grid, reset paging (we'll let pagination controls refetch pages).
      if (type === 'grid' && payload?.kind === 'clients') {
        get().resetClientListPaging()
      }
      get().setRightPanel({ type, payload, title: resp.title || null })
    } else if (type === 'empty') {
      get().setRightPanel({ type: 'empty', payload: null, title: null })
    }
  },

  // Translate already-rendered chat text when the user switches language.
  // Uses backend /translate when enabled; otherwise it is a no-op.
  translateAllMessages: async (targetLang, opts) => {
    const lang = String(targetLang || '').trim() || 'en'
    const translateUser = Boolean(opts?.translateUser)
    const msgs = get().messages

    const translated = await Promise.all(
      msgs.map(async (m) => {
        const original = m?.meta?.original || m.content
        const from = m?.meta?.originalLang || 'en'
        // Keep user messages as-is unless you explicitly want them translated too.
        // If you want both user+assistant translated, remove this guard.
        const shouldTranslate = m.role === 'assistant' || translateUser
        const text = shouldTranslate ? await translateText({ text: original, from, to: lang }) : m.content
        return { ...m, content: text }
      }),
    )

    set({ messages: translated })
  },
}))
