export function isSpeechSupported() {
  return typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
}

const LANG_TO_LOCALE = {
  // Core app languages
  en: 'en-US',
  hi: 'hi-IN',
  te: 'te-IN',

  // Common extras (works only if the browser/OS supports it)
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  bn: 'bn-IN',
  pa: 'pa-IN',
  ur: 'ur-IN',

  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
  ar: 'ar-SA',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
}

function normalizeLocale(lang) {
  const l = String(lang || '').trim()
  if (!l) return 'en-US'

  // If already a locale tag like "en-US" or "te-IN", use it.
  if (l.includes('-')) return l

  return LANG_TO_LOCALE[l] || 'en-US'
}

export function startSpeechRecognition({ lang, onText, onError, onEnd }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) {
    onError?.(new Error('SpeechRecognition not supported'))
    return null
  }

  const recog = new SR()
  recog.interimResults = false
  recog.maxAlternatives = 1
  recog.lang = normalizeLocale(lang)

  recog.onresult = (e) => {
    const text = e?.results?.[0]?.[0]?.transcript
    if (text) onText?.(text)
  }

  recog.onerror = (e) => {
    onError?.(e)
  }

  recog.onend = () => {
    onEnd?.()
  }

  recog.start()
  return recog
}
