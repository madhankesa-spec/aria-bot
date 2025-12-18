import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const setLang = (lng) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="sr-only">{t('language')}</span>
      <div className="inline-flex overflow-hidden rounded-lg border border-slate-200/70 bg-white/70 p-1 backdrop-blur">
        <button
          type="button"
          onClick={() => setLang('en')}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
            i18n.language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLang('hi')}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
            i18n.language === 'hi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          हिं
        </button>
        <button
          type="button"
          onClick={() => setLang('te')}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
            i18n.language === 'te' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-700 hover:bg-white/60'
          }`}
        >
          తె
        </button>
      </div>
    </div>
  )
}
