import { useTranslation } from 'react-i18next'
import { PlatformBadge } from '../components/PlatformBadge'
import { Card, H2, PageHeader, useList } from './LearnLayout'

type Item = { name: string; body: string }

/** "What lives inside what" — the same nesting the playground lanes show. */
function Nest({ layers, tone }: { layers: { label: string; side?: string[] }[]; tone: 'android' | 'ios' }) {
  const border = tone === 'android' ? 'border-droid-ink/40 dark:border-droid/40' : 'border-apple-ink/40 dark:border-apple/40'
  const render = (i: number): React.ReactNode => {
    if (i >= layers.length) return null
    const l = layers[i]
    return (
      <div className={`rounded-xl border-2 ${border} ${i % 2 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'} p-2.5`}>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <code className="font-mono text-xs font-semibold">{l.label}</code>
          {l.side?.map((s) => (
            <span key={s} className="rounded-md border border-dashed border-slate-400 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              {s}
            </span>
          ))}
        </div>
        {render(i + 1)}
      </div>
    )
  }
  return render(0)
}

export function BuildingBlocks() {
  const { t } = useTranslation()
  const android = useList<Item>('bb.items.android')
  const ios = useList<Item>('bb.items.ios')
  const map = useList<{ a: string; i: string }>('bb.map')

  return (
    <>
      <PageHeader title={t('bb.title')} lead={t('bb.lead')} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <PlatformBadge platform="android" />
            <H2>{t('bb.android')}</H2>
          </div>
          <Nest
            tone="android"
            layers={[
              { label: 'Linux process', side: ['Service', 'BroadcastReceiver', 'ContentProvider'] },
              { label: 'Application' },
              { label: 'Activity', side: ['ViewModel'] },
              { label: 'Fragment / NavBackStackEntry' },
              { label: '@Composable' },
            ]}
          />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{t('bb.android.manifest')}</p>
          <ul className="mt-4 space-y-3">
            {android.map((it) => (
              <li key={it.name}>
                <code className="font-mono text-sm font-semibold text-droid-ink dark:text-droid">{it.name}</code>
                <p className="text-sm text-slate-700 dark:text-slate-300">{it.body}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <PlatformBadge platform="ios" />
            <H2>{t('bb.ios')}</H2>
          </div>
          <Nest
            tone="ios"
            layers={[
              { label: 'App process', side: ['Widget ext.', 'Share ext.', 'BGTask'] },
              { label: 'UIApplication + AppDelegate' },
              { label: 'UIWindowScene + SceneDelegate', side: ['scene #2…'] },
              { label: 'UIWindow → UIViewController' },
              { label: 'SwiftUI View' },
            ]}
          />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{t('bb.ios.plist')}</p>
          <ul className="mt-4 space-y-3">
            {ios.map((it) => (
              <li key={it.name}>
                <code className="font-mono text-sm font-semibold text-apple-ink dark:text-apple">{it.name}</code>
                <p className="text-sm text-slate-700 dark:text-slate-300">{it.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mt-5">
        <H2>{t('bb.map.title')}</H2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 pr-4">
                  <PlatformBadge platform="android" />
                </th>
                <th className="py-2">
                  <PlatformBadge platform="ios" />
                </th>
              </tr>
            </thead>
            <tbody>
              {map.map((r) => (
                <tr key={r.a} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="py-2 pr-4 font-mono text-[13px]">{r.a}</td>
                  <td className="py-2 font-mono text-[13px]">{r.i}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
