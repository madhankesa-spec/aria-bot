import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sendChatQuery } from './services/api'
import { useChatStore } from './store/chatStore'
import GlobalLayout from './components/GlobalLayout'
import ChatWindow from './components/ChatWindow'
import QueryInput from './components/QueryInput'
import RightPanelRenderer from './components/RightPanelRenderer'
import WelcomeBanner from './components/WelcomeBanner'
import SuggestionSection from './components/SuggestionSection'
import ActionsMenu from './components/ActionsMenu'
import './App.css'

export default function App() {
  const { i18n, t } = useTranslation()
  const messages = useChatStore((s) => s.messages)
  const rightPanel = useChatStore((s) => s.rightPanel)
  const addMessage = useChatStore((s) => s.addMessage)
  const hydrateFromResponse = useChatStore((s) => s.hydrateFromResponse)
  const setSending = useChatStore((s) => s.setSending)
  const setError = useChatStore((s) => s.setError)
  const sending = useChatStore((s) => s.status.sending)
  const setRightPanel = useChatStore((s) => s.setRightPanel)
  const fetchClientsPage = useChatStore((s) => s.fetchClientsPage)
  const translateAllMessages = useChatStore((s) => s.translateAllMessages)
  const [ivrMode, setIvrMode] = useState('main')

  // Seed a localized greeting once, but only if nothing is already in the store.
  // (Some stores hydrate async; seeding too early can create a duplicate greeting.)
  useEffect(() => {
    if (messages && messages.length > 0) return
    addMessage('assistant', t('greeting'), { original: t('greeting'), originalLang: i18n.language })
  }, [messages, addMessage, t, i18n.language])

  const hasUserMessage = (messages || []).some((m) => m?.role === 'user' && String(m?.content || '').trim().length > 0)
  const isLanding = !hasUserMessage
  const hasDetails = rightPanel && rightPanel.type && rightPanel.type !== 'empty'
  const isClientList = rightPanel?.type === 'grid' && rightPanel?.payload?.kind === 'clients'


  useEffect(() => {
    if (isClientList) setIvrMode('list')
    if (!hasDetails && ivrMode !== 'main') setIvrMode('main')
  }, [hasDetails, isClientList, ivrMode])

  // Keep already-rendered assistant text aligned with selected language.
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.__ariaLang = i18n.language
    } catch (e) {
      void e
    }
    translateAllMessages?.(i18n.language)
  }, [i18n.language, translateAllMessages])

  const setInputText = (v) => {
    try {
      window?.__ariaSetInputText?.(v)
    } catch (e) {
      void e
    }
  }

  const actionItems =
    ivrMode === 'main'
      ? [
          {
            key: 'listClients',
            label: t('actions.listClients'),
            onClick: () => {
              // Fetch page 1 using the paginated endpoint so the grid can page next/prev.
              fetchClientsPage(1).catch(() => onSend(t('commands.listClients')))
            },
          },
          {
            key: 'searchClient',
            label: t('actions.getClientByName'),
            onClick: () => {
              setInputText(t('commands.clientByNamePrefix'))
            },
          },
          {
            key: 'searchClientId',
            label: t('actions.getClientById'),
            onClick: () => {
              setInputText(t('commands.clientByIdPrefix'))
            },
          },
          {
            key: 'getAddress',
            label: t('actions.getAddressById'),
            onClick: () => {
              setInputText(t('commands.addressByClientIdPrefix'))
            },
          },
          {
            key: 'getAddressByName',
            label: t('actions.getAddressByName'),
            onClick: () => {
              setInputText(t('commands.addressByClientNamePrefix'))
            },
          },
        ]
      : [
          {
            key: 'back',
            label: t('actions.back'),
            onClick: () => {
              setIvrMode('main')
              setRightPanel({ type: 'empty', payload: null, title: null })
            },
          },
        ]

  const onSend = useCallback(
    async (message) => {
      const trimmed = (message || '').trim()
      if (!trimmed) return
      addMessage('user', trimmed)
      setSending(true)
      setError(null)
      try {
        const resp = await sendChatQuery(trimmed, i18n.language)
        hydrateFromResponse(resp)
      } catch {
        setError('Request failed')
        addMessage('assistant', 'Sorry, I could not process that right now. Please try again.')
      } finally {
        setSending(false)
      }
    },
    [addMessage, hydrateFromResponse, i18n.language, setError, setSending],
  )

  const onClientPick = useCallback(
    async (client) => {
      if (!client?.PTY_ID) return
      setIvrMode('list')
      setRightPanel({ type: 'form', payload: { client }, title: 'Client Details' })
    },
    [setRightPanel],
  )

  const main = isLanding ? (
    <div className="flex gap-6 min-h-[calc(100dvh-120px)]">
      {/* Left Panel: Welcome & Suggestions */}
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="relative pr-2">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full opacity-25 blur-3xl aria-gradient" />
          </div>

          <div className="flex min-h-[calc(100dvh-120px)] w-full flex-col justify-center py-8 sm:py-10">
            <div className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute left-1/2 top-6 h-64 w-160 -translate-x-1/2 rounded-full opacity-30 blur-3xl aria-gradient" />
            </div>

            <div className="w-full space-y-8">
              <WelcomeBanner />
              {/* Hide the actions menu on the landing / start screen to keep the homepage clean */}
              
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Quick Actions Menu + Input */}
      <div className="w-full lg:w-[45%]  2xl:w-[50%]  flex-shrink-0 justify-center overflow-auto border-l border-slate-200/70 pl-6">
       <div className="w-full h-full">
           <SuggestionSection onSelect={onSend} onSend={onSend} sending={sending} />
       </div>
      </div>
    </div>
  ) : (
    <div className="flex gap-6 min-h-[calc(100dvh-120px)]">
      {/* Left Panel: Chat/Bot Content */}
      <div className="flex-1 min-w-0 overflow-auto">
        <div className="pr-2">
          <ChatWindow hideGreeting={isLanding} bottomSlot={<ActionsMenu items={actionItems} />} />
        </div>
      </div>

      {/* Right Panel: Response Data Tables */}
      {hasDetails && (
        <div className="w-full lg:w-[45%] 2xl:w-[50%] flex-shrink-0 overflow-auto border-l border-slate-200/70 pl-6">
          <div className="space-y-4">
            <RightPanelRenderer panel={rightPanel} onClientPick={onClientPick} />
          </div>
        </div>
      )}
    </div>
  )

  // When on the landing page, main area contains input in right panel
  // On chat page, show input in footer
  return (
    <GlobalLayout main={main} mainFullWidth={isLanding} bottomBar={!isLanding ? <QueryInput onSend={onSend} sending={sending} /> : null} />
  )
}
