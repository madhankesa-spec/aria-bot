import { useEffect, useRef } from 'react'
import { useChatStore } from '../store/chatStore'
import MessageBubble from './MessageBubble'

export default function ChatWindow({ bottomSlot, hideGreeting }) {
  const messages = useChatStore((s) => s.messages)
  const bottomRef = useRef(null)

  // Guard: sometimes the store hydrates and the UI also seeds a greeting,
  // producing two identical first assistant messages.
  const dedupedMessages = (() => {
    const list = Array.isArray(messages) ? messages : []
    if (list.length < 2) return list
    const a = list[0]
    const b = list[1]
    const aText = String(a?.content ?? '').trim()
    const bText = String(b?.content ?? '').trim()
    if (a?.role === 'assistant' && b?.role === 'assistant' && aText && aText === bText) {
      return [a, ...list.slice(2)]
    }
    return list
  })()

  const visibleMessages = hideGreeting
    ? dedupedMessages.filter((m, idx) => !(idx === 0 && m?.role === 'assistant'))
    : dedupedMessages

  useEffect(() => {
    // Scroll to the bottom as new messages arrive.
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [visibleMessages.length])

  return (
    <div className="relative py-2">
      <div className="space-y-3 pb-2">
        {visibleMessages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}
        <div ref={bottomRef} />
      </div>

      {bottomSlot && <div className="-mx-4 mt-3">{bottomSlot}</div>}
    </div>
  )
}
