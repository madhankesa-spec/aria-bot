import { api } from './api'

/**
 * Optional translation API integration.
 *
 * - Primary: i18next resources (static)
 * - Fallback: if VITE_TRANSLATION_API_ENABLE=true, call backend /translate
 */

const enabled = String(import.meta.env.VITE_TRANSLATION_API_ENABLE || '').toLowerCase() === 'true'

export async function translateText({ text, from = 'en', to }) {
  const q = String(text ?? '').trim()
  if (!q) return ''
  if (!enabled) return q
  if (!to || to === from) return q

  const res = await api.post('/translate', { text: q, from, to })
  return res.data?.text ?? q
}
