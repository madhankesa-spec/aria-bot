import { useTranslation } from 'react-i18next'

export default function WelcomeBanner() {
  const { t } = useTranslation()
  return (
    <section className="rounded-2xl bg-white/85 px-7 py-8 shadow-(--aria-shadow-md) backdrop-blur sm:px-10 sm:py-10 md:px-12 md:py-12">
      <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
        <div className="w-full">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-700/80">{t('welcome.kicker')}</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-slate-900 aria-title sm:text-4xl md:text-5xl">
            {t('welcome.title')}
          </h1>
          <p className="mt-4 text-base text-slate-600 aria-text sm:text-lg">{t('welcome.subtitle')}</p>
        </div>
        
      </div>
    </section>
  )
}
