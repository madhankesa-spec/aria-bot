import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isSpeechSupported, startSpeechRecognition } from '../utils/speech'

export default function QueryInput({ onSend, sending }) {
  const { t, i18n } = useTranslation()
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const recRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__ariaSetInputText = (v) => {
        setText(String(v || ''))
        setShowHints(false)
      }
    }
    return () => {
      if (typeof window !== 'undefined' && window.__ariaSetInputText) {
        try {
          delete window.__ariaSetInputText
        } catch (e) {
          void e
        }
      }
    }
  }, [])

  const suggestions = useMemo(() => {
    const s = t('suggestions', { returnObjects: true })
    return [s.listClients, s.showClient, s.getAddress].filter(Boolean)
  }, [t])

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop?.()
      } catch (e) {
        void e
      }
    }
  }, [])

  const submit = () => {
    const v = text.trim()
    if (!v || sending) return
    onSend(v)
    setText('')
    setShowHints(false)
  }

  const startVoice = () => {
    if (!isSpeechSupported() || listening) return
    setListening(true)
    recRef.current = startSpeechRecognition({
      lang: i18n.language,
      onText: (v) => {
        setText(v)
        setListening(false)
        setShowHints(false)
      },
      onError: () => {
        setListening(false)
      },
      onEnd: () => {
        setListening(false)
      },
    })
  }

  return (
    <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setShowHints(true)
            }}
            onFocus={() => setShowHints(true)}
            onBlur={() => setTimeout(() => setShowHints(false), 120)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder={t('typeYourQuery')}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
          />

          {showHints && suggestions.length > 0 && text.trim().length === 0 && (
            <div className="absolute left-0 right-0 mt-2 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setText(s)
                    setShowHints(false)
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={startVoice}
          disabled={!isSpeechSupported() || sending}
          className={`h-11.5 rounded-lg border px-3 text-sm font-medium transition ${
            listening
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          } disabled:opacity-50`}
          title={t('voice')}
        >
          {listening ? t('listening') : t('voice')}
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={sending || text.trim().length === 0}
          className="h-11.5 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {t('send')}
        </button>
    </div>
  )
}
