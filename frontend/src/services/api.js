import axios from 'axios'

export const api = axios.create({
  // In production we serve frontend + backend on the same domain via reverse proxy.
  // In dev, default backend runs on http://localhost:8000.
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? 'http://localhost:8000' : ''),
  timeout: 30000,
  headers: {
    // Make sure non-Latin text (Telugu/Hindi) is encoded predictably.
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json',
  },
})

export async function sendChatQuery(message, lang) {
  const res = await api.post(
    '/chat/query',
    { message, lang },
    {
      headers: {
        // Helps correlate backend logs with a specific UI call when debugging.
        'X-Aria-Client': 'frontend',
      },
    }
  )
  return res.data
}

export async function getClients(params) {
  const res = await api.get('/clients', { params })
  return res.data
}

export async function getClientByName(name) {
  const res = await api.get(`/client/name/${encodeURIComponent(name)}`)
  return res.data
}

export async function getClientAddressesById(id) {
  const res = await api.get(`/client/${encodeURIComponent(id)}/address`)
  return res.data
}

export async function getAddressByClientName(name) {
  const res = await api.get(`/client/address/name/${encodeURIComponent(name)}`)
  return res.data
}
