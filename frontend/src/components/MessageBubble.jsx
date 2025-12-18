import botAvatar from '../assets/aria_bot.jpg'

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-3 text-sm leading-relaxed text-white shadow-md hover:shadow-lg transition-shadow">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <img
        src={botAvatar}
        alt="Aria"
        className="mt-0.5 h-10 w-10 rounded-full border-2 border-slate-200 object-cover shadow-sm flex-shrink-0"
        loading="lazy"
        decoding="async"
      />
      <div className="max-w-[85%] rounded-2xl border border-slate-200/60 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm hover:shadow-md transition-shadow">
        {content}
      </div>
    </div>
  )
}
