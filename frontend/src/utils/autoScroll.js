import { useRef, useEffect } from 'react'

export function useScrollToTop(deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    try {
      el.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      el.scrollTop = 0
    }
  }, deps)
  return ref
}

export function useScrollToBottom(deps = []) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } catch {
      el.scrollTop = el.scrollHeight
    }
  }, deps)
  return ref
}
