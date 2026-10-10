import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlatformBadge } from '../components/PlatformBadge'
import { PageHeader } from './LearnLayout'

/** One row: the same idea drawn the Material way and the iOS way. */
function Row({ title, android, ios, aCode, iCode }: { title: string; android: React.ReactNode; ios: React.ReactNode; aCode: string; iCode: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 font-bold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <PlatformBadge platform="android" />
            <code className="truncate font-mono text-[11px] text-slate-500">{aCode}</code>
          </div>
          <div className="flex min-h-28 items-center justify-center rounded-xl bg-[#fef7ff] p-3 text-[#1d1b20] dark:bg-[#141218] dark:text-[#e6e0e9]">{android}</div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <PlatformBadge platform="ios" />
            <code className="truncate font-mono text-[11px] text-slate-500">{iCode}</code>
          </div>
          <div
            className="flex min-h-28 items-center justify-center rounded-xl bg-[#f2f2f7] p-3 text-black dark:bg-black dark:text-white"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif' }}
          >
            {ios}
          </div>
        </div>
      </div>
    </section>
  )
}

const M3 = { primary: 'bg-[#6750a4] text-white dark:bg-[#d0bcff] dark:text-[#381e72]', container: 'bg-[#e8def8] dark:bg-[#4a4458]', surface: 'bg-[#f3edf7] dark:bg-[#211f26]' }
const IOS = { tint: 'text-[#007aff] dark:text-[#0a84ff]', fill: 'bg-[#007aff] text-white dark:bg-[#0a84ff]', card: 'bg-white dark:bg-[#1c1c1e]' }

export function Widgets() {
  const { t } = useTranslation()
  const [on, setOn] = useState(true)
  const [tab, setTab] = useState(0)
  const tabs = [t('w.sample.home'), t('w.sample.search'), t('w.sample.settings')]

  return (
    <>
      <PageHeader title={t('w.title')} lead={t('w.lead')} />
      <div className="grid gap-4 2xl:grid-cols-2">
        <Row
          title={t('w.topBar')}
          aCode="TopAppBar"
          iCode=".navigationTitle"
          android={
            <div className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 ${M3.surface}`}>
              <span>←</span>
              <span className="text-lg">{t('w.sample.title')}</span>
              <span className="ml-auto">⋮</span>
            </div>
          }
          ios={
            <div className="w-full">
              <div className={`flex justify-between text-sm ${IOS.tint}`}>
                <span>‹ Back</span>
                <span>Edit</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{t('w.sample.title')}</div>
            </div>
          }
        />
        <Row
          title={t('w.bottomNav')}
          aCode="NavigationBar"
          iCode="TabView"
          android={
            <div className={`flex w-full justify-around rounded-lg py-2 ${M3.surface}`}>
              {tabs.map((l, i) => (
                <button key={l} onClick={() => setTab(i)} className="flex flex-col items-center gap-1 text-xs">
                  <span className={`rounded-full px-4 py-1 ${tab === i ? M3.container : ''}`}>{['⌂', '⌕', '⚙'][i]}</span>
                  <span className={tab === i ? 'font-bold' : ''}>{l}</span>
                </button>
              ))}
            </div>
          }
          ios={
            <div className="flex w-full justify-around border-t border-black/10 pt-2 dark:border-white/15">
              {tabs.map((l, i) => (
                <button key={l} onClick={() => setTab(i)} className={`flex flex-col items-center text-[10px] ${tab === i ? IOS.tint : 'text-[#8e8e93]'}`}>
                  <span className="text-lg leading-none">{['⌂', '⌕', '⚙'][i]}</span>
                  {l}
                </button>
              ))}
            </div>
          }
        />
        <Row
          title={t('w.button')}
          aCode="Button / OutlinedButton"
          iCode=".borderedProminent / .bordered"
          android={
            <div className="flex gap-2">
              <span className={`rounded-full px-5 py-2.5 text-sm font-medium ${M3.primary}`}>{t('w.sample.action')}</span>
              <span className="rounded-full border border-[#79747e] px-5 py-2.5 text-sm font-medium text-[#6750a4] dark:text-[#d0bcff]">{t('w.sample.cancel')}</span>
            </div>
          }
          ios={
            <div className="flex gap-2">
              <span className={`rounded-xl px-5 py-2 text-sm font-semibold ${IOS.fill}`}>{t('w.sample.action')}</span>
              <span className={`rounded-xl bg-[#007aff]/15 px-5 py-2 text-sm font-semibold ${IOS.tint}`}>{t('w.sample.cancel')}</span>
            </div>
          }
        />
        <Row
          title={t('w.fab')}
          aCode="FloatingActionButton"
          iCode="ToolbarItem(.primaryAction)"
          android={<span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-md ${M3.container}`}>✎</span>}
          ios={
            <div className="w-full">
              <div className={`mb-2 flex justify-end text-xl ${IOS.tint}`}>✎</div>
              <p className="text-xs text-[#8e8e93]">{t('w.fab.ios')}</p>
            </div>
          }
        />
        <Row
          title={t('w.switch')}
          aCode="Switch"
          iCode="Toggle"
          android={
            <button onClick={() => setOn(!on)} className="flex w-full items-center justify-between px-2">
              {t('w.sample.wifi')}
              <span className={`flex h-8 w-13 items-center rounded-full border-2 px-1 transition ${on ? 'justify-end border-[#6750a4] bg-[#6750a4] dark:border-[#d0bcff] dark:bg-[#d0bcff]' : 'border-[#79747e] bg-transparent'}`}>
                <span className={`rounded-full ${on ? 'h-6 w-6 bg-white dark:bg-[#381e72]' : 'h-4 w-4 bg-[#79747e]'}`} />
              </span>
            </button>
          }
          ios={
            <button onClick={() => setOn(!on)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 ${IOS.card}`}>
              {t('w.sample.wifi')}
              <span className={`flex h-7 w-12 items-center rounded-full p-0.5 transition ${on ? 'justify-end bg-[#34c759]' : 'bg-[#e9e9ea] dark:bg-[#39393d]'}`}>
                <span className="h-6 w-6 rounded-full bg-white shadow" />
              </span>
            </button>
          }
        />
        <Row
          title={t('w.list')}
          aCode="LazyColumn { ListItem }"
          iCode="List(.insetGrouped)"
          android={
            <div className="w-full divide-y divide-[#cac4d0] dark:divide-[#49454f]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${M3.container}`}>{i}</span>
                  <span className="text-sm">
                    {t('w.sample.item')} {i}
                  </span>
                </div>
              ))}
            </div>
          }
          ios={
            <div className={`w-full divide-y divide-black/10 rounded-xl dark:divide-white/10 ${IOS.card}`}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                  {t('w.sample.item')} {i}
                  <span className="text-[#c4c4c6]">›</span>
                </div>
              ))}
            </div>
          }
        />
        <Row
          title={t('w.dialog')}
          aCode="AlertDialog"
          iCode=".alert"
          android={
            <div className={`w-64 rounded-[28px] p-5 ${M3.surface}`}>
              <div className="mb-2 text-lg">{t('w.sample.dialogTitle')}</div>
              <div className="mb-4 text-sm opacity-80">{t('w.sample.dialogBody')}</div>
              <div className="flex justify-end gap-4 text-sm font-medium text-[#6750a4] dark:text-[#d0bcff]">
                <span>{t('w.sample.cancel')}</span>
                <span>{t('w.sample.delete')}</span>
              </div>
            </div>
          }
          ios={
            <div className="w-64 overflow-hidden rounded-2xl bg-white/90 text-center dark:bg-[#2c2c2e]/90">
              <div className="px-4 pt-4 pb-3">
                <div className="font-semibold">{t('w.sample.dialogTitle')}</div>
                <div className="text-xs">{t('w.sample.dialogBody')}</div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-black/15 border-t border-black/15 dark:divide-white/15 dark:border-white/15">
                <span className={`py-2 ${IOS.tint}`}>{t('w.sample.cancel')}</span>
                <span className="py-2 font-semibold text-[#ff3b30]">{t('w.sample.delete')}</span>
              </div>
            </div>
          }
        />
        <Row
          title={t('w.sheet')}
          aCode="ModalBottomSheet"
          iCode=".sheet + .presentationDetents"
          android={
            <div className={`w-full rounded-t-[28px] px-4 pt-2 pb-4 ${M3.surface}`}>
              <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-[#79747e]" />
              <div className="mb-2 text-sm font-medium">{t('w.sample.sheet')}</div>
              <div className="text-sm">✉ {t('w.sample.email')}</div>
            </div>
          }
          ios={
            <div className={`w-full rounded-t-2xl px-4 pt-1.5 pb-4 ${IOS.card}`}>
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[#c4c4c6]" />
              <div className="mb-2 text-sm font-semibold">{t('w.sample.sheet')}</div>
              <div className="text-sm">✉ {t('w.sample.email')}</div>
            </div>
          }
        />
        <Row
          title={t('w.textField')}
          aCode="OutlinedTextField"
          iCode="TextField(.roundedBorder)"
          android={
            <div className="relative w-full rounded border border-[#79747e] px-3 py-3 text-sm">
              <span className={`absolute -top-2 left-2 px-1 text-[11px] text-[#6750a4] dark:text-[#d0bcff] bg-[#fef7ff] dark:bg-[#141218]`}>{t('w.sample.search')}</span>
              Kotlin
            </div>
          }
          ios={<div className={`w-full rounded-lg px-3 py-2 text-sm ${IOS.card}`}>⌕ {t('w.sample.search')}</div>}
        />
        <Row
          title={t('w.snackbar')}
          aCode="Snackbar"
          iCode="—"
          android={
            <div className="flex w-full items-center justify-between rounded bg-[#322f35] px-4 py-3 text-sm text-[#f5eff7]">
              {t('w.sample.snack')}
              <span className="font-medium text-[#d0bcff]">{t('w.sample.undo')}</span>
            </div>
          }
          ios={<p className="text-xs text-[#8e8e93]">{t('w.snackbar.ios')}</p>}
        />
      </div>
    </>
  )
}
