import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import botAvatar from '../assets/aria_bot.jpg'

function TopBar() {
  return (
    <header className="h-14 text-white aria-gradient shadow-[0_10px_30px_rgba(11,18,32,0.12)]">
      <div className="flex h-full w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 overflow-hidden rounded-xl bg-white/20 shadow-sm backdrop-blur">
            <img src={botAvatar} alt="Aria" className="h-full w-full object-cover" />
          </div>
          <div className="text-sm font-extrabold tracking-[0.22em] aria-title sm:text-base">ASK ARIA</div>
        </div>
        {/* Removed minimize/close controls for cleaner full-screen homepage */}
        <div className="flex items-center gap-3 text-lg" />
      </div>
    </header>
  )
}

export default function GlobalLayout({ main, bottomBar, mainFullWidth = false }) {
  const { i18n } = useTranslation()

  useEffect(() => {
    try {
      window.localStorage.setItem('aria_lang', i18n.language)
    } catch (e) {
      void e
    }
  }, [i18n.language])

  return (
    <div className="min-h-dvh text-slate-900 flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-hidden">
        <div className={`h-full w-full ${mainFullWidth ? '' : 'px-4 py-6 sm:px-6'}`}>{main}</div>
      </main>
      {bottomBar && (
        <footer className="border-t border-slate-200/70 bg-white/85 backdrop-blur">
          <div className="flex w-full items-center gap-3 px-4 py-3 sm:px-6">
            <LanguageSwitcher />
            <div className="flex-1">{bottomBar}</div>
          </div>
        </footer>
      )}
    </div>
  )
}
