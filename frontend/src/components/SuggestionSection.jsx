import { useTranslation } from 'react-i18next'
import QueryInput from './QueryInput'
import LanguageSwitcher from './LanguageSwitcher'

export default function SuggestionSection({ onSelect, onSend, sending }) {
  const { t } = useTranslation()

  const items = [
    { label: t('suggestions.listClients'), query: t('suggestions.listClients') },
    { label: t('suggestions.showClient'), query: t('suggestions.showClient') },
    { label: t('suggestions.getAddress'), query: t('suggestions.getAddress') },
  ]

  return (
    <section className="w-full h-full p-6">
      <div className="h-full rounded-2xl bg-white/95 border border-slate-200/70 shadow-lg overflow-hidden backdrop-blur flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-200/70 bg-gradient-to-r from-[#F53D3D] to-orange-300 px-6 py-6 flex-shrink-0 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t("dontKnow.title", "Don't know what to ask?")}</h2>
            <p className="mt-2 text-sm text-slate-600">{t('dontKnow.subtitle', 'Try one of these')}</p>
          </div>
          <div className="shrink-0">
            <div className="h-32 w-32 rounded-full aria-gradient aria-glow shadow-md sm:h-36 sm:w-36 md:h-40 md:w-40">
              <div className="flex h-full w-full items-center justify-center">
                <img src="/adi_assistant.png" alt="Assistant" className="h-full w-full object-cover rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Menu Items - Button Style */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-6">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => onSelect?.(it.query)}
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 border-2 border-slate-200 text-left font-semibold text-slate-900 hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 transition-all duration-200 group shadow-sm hover:shadow-md flex items-center justify-between"
              aria-label={it.label}
            >
              <span className="text-base text-slate-900 group-hover:text-blue-700">{it.label}</span>
              <span className="text-2xl text-slate-400 group-hover:text-blue-600 transition-colors ml-3 flex-shrink-0">→</span>
            </button>
          ))}
        </div>

        {/* Input Section at Bottom */}
        <div className="border-t border-slate-200/70 bg-gradient-to-r from-slate-50 to-white px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <LanguageSwitcher />
          </div>
          <QueryInput onSend={onSend || onSelect} sending={sending} />
        </div>
      </div>
    </section>
  )
}
