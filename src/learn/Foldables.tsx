import { motion } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { PlatformBadge } from '../components/PlatformBadge'
import { Card, H2, PageHeader, useList } from './LearnLayout'

/** Side view of a book-style foldable at a given hinge angle. */
function PostureGlyph({ angle }: { angle: number }) {
  const rad = (angle * Math.PI) / 180
  const len = 46
  // Bottom half lies flat to the right of the hinge; the top half opens by `angle` degrees.
  const x2 = 60 + len * Math.cos(rad)
  const y2 = (angle === 0 ? 53 : 60) - len * Math.sin(rad)
  return (
    <svg viewBox="0 0 120 70" className="h-16 w-28" aria-hidden>
      <line x1={60} y1={60} x2={106} y2={60} strokeWidth={6} strokeLinecap="round" className="stroke-slate-700 dark:stroke-slate-300" />
      <line x1={60} y1={angle === 0 ? 53 : 60} x2={x2} y2={y2} strokeWidth={6} strokeLinecap="round" className="stroke-slate-500 dark:stroke-slate-400" />
      <circle cx={60} cy={60} r={5} className="fill-amber-400" />
    </svg>
  )
}

function SpanDemo() {
  const { t } = useTranslation()
  const [span, setSpan] = useState(false)
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {[false, true].map((v) => (
          <button
            key={String(v)}
            onClick={() => setSpan(v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${span === v ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800'}`}
          >
            {v ? t('f.demo.span') : t('f.demo.single')}
          </button>
        ))}
      </div>
      <div className="flex items-stretch justify-center">
        {[0, 1].map((screen) => (
          <div key={screen} className="flex items-stretch">
            <div className="h-56 w-36 rounded-xl bg-slate-900 p-1.5">
              <div className="relative h-full overflow-hidden rounded-lg bg-white dark:bg-slate-950">
                {span ? (
                  screen === 0 ? (
                    <motion.div layoutId="span-list" className="h-full space-y-1.5 bg-droid/10 p-2">
                      <div className="text-[10px] font-semibold">List</div>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-5 rounded ${i === 2 ? 'bg-droid-ink/60' : 'bg-slate-200 dark:bg-slate-800'}`} />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full bg-droid/5 p-2">
                      <div className="text-[10px] font-semibold">Detail 2</div>
                      <div className="mt-2 h-20 rounded bg-slate-200 dark:bg-slate-800" />
                    </motion.div>
                  )
                ) : screen === 0 ? (
                  <motion.div layoutId="span-list" className="h-full space-y-1.5 bg-droid/10 p-2">
                    <div className="text-[10px] font-semibold">List</div>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-5 rounded bg-slate-200 dark:bg-slate-800" />
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-100 text-[10px] text-slate-400 dark:bg-slate-900">other app</div>
                )}
              </div>
            </div>
            {screen === 0 && (
              <div className="flex w-5 flex-col items-center justify-center">
                <div className="h-48 w-2 rounded-full bg-amber-400" title={t('f.demo.hinge')} />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-400">{span ? t('f.demo.note.span') : t('f.demo.note.single')}</p>
      {span && <p className="mt-1 text-center font-mono text-xs text-slate-500">FoldingFeature(isSeparating = true, occlusionType = FULL)</p>}
    </div>
  )
}

const SOURCES = [
  { label: 'Apple — Preparing your app for iPhone Duo', href: 'https://developer.apple.com/documentation/technologyoverviews/preparing-your-app-for-iphone-duo' },
  { label: 'Apple — Leverage multiple displays and scenes on iPhone Duo', href: 'https://developer.apple.com/videos/play/tech-talks/111464/' },
  { label: 'Apple Newsroom — Apple unveils iPhone Duo', href: 'https://www.apple.com/newsroom/2026/09/apple-unveils-iphone-duo/' },
  { label: 'Android — Make your app fold aware', href: 'https://developer.android.com/develop/ui/compose/layouts/adaptive/foldables/make-your-app-fold-aware' },
  { label: 'Android — Window size classes', href: 'https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes' },
  { label: 'Android — Handle configuration changes', href: 'https://developer.android.com/guide/topics/resources/runtime-changes' },
]

export function Foldables() {
  const { t } = useTranslation()
  const androidItems = useList<string>('f.android.items')
  const iosItems = useList<string>('f.ios.items')
  const postures = [
    { angle: 0, key: 'f.posture.closed' },
    { angle: 100, key: 'f.posture.half' },
    { angle: 180, key: 'f.posture.open' },
  ]

  return (
    <>
      <PageHeader title={t('f.title')} lead={t('f.lead')} />

      <Card className="mb-5">
        <H2>{t('f.postures')}</H2>
        <div className="grid gap-4 sm:grid-cols-3">
          {postures.map((p) => (
            <div key={p.key} className="flex flex-col items-center rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/50">
              <PostureGlyph angle={p.angle} />
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{t(p.key)}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm">
          <Link to="/" className="font-semibold underline underline-offset-2">
            {t('nav.playground')} →
          </Link>{' '}
          <span className="text-slate-600 dark:text-slate-400">{t('sc.unfold.d')}</span>
        </p>
      </Card>

      <Card className="mb-5">
        <H2>{t('f.compare.title')}</H2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border-2 border-droid-ink/30 p-4 dark:border-droid/30">
            <PlatformBadge platform="android" className="mb-2" />
            <p className="text-sm">{t('f.compare.android')}</p>
            <p className="mt-2 font-mono text-xs text-slate-500">onPause → onStop → onDestroy → onCreate(Bundle) → onStart → onResume</p>
          </div>
          <div className="rounded-xl border-2 border-apple-ink/30 p-4 dark:border-apple/30">
            <PlatformBadge platform="ios" className="mb-2" />
            <p className="text-sm">{t('f.compare.ios')}</p>
            <p className="mt-2 font-mono text-xs text-slate-500">windowScene(_:didUpdate…) → viewWillTransition → traits → onHingeChange</p>
          </div>
        </div>
      </Card>

      <Card className="mb-5">
        <H2>{t('f.devices')}</H2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { p: 'android' as const, k: 'f.dev.fold' },
            { p: 'android' as const, k: 'f.dev.duo' },
            { p: 'ios' as const, k: 'f.dev.iphone' },
          ].map((d) => (
            <div key={d.k} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <PlatformBadge platform={d.p} className="mb-2" />
              <h3 className="font-semibold">{t(d.k)}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t(`${d.k}.d`)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-5">
        <H2>{t('f.demo.title')}</H2>
        <SpanDemo />
      </Card>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <PlatformBadge platform="android" />
            <H2>{t('f.android.title')}</H2>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {androidItems.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <PlatformBadge platform="ios" />
            <H2>{t('f.ios.title')}</H2>
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">{t('pg.ios27')}</span>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {iosItems.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500 italic">{t('f.reported')}</p>
        </Card>
      </div>

      <section className="text-sm">
        <h2 className="mb-2 font-semibold">{t('common.sources')}</h2>
        <ul className="space-y-1">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noreferrer" className="text-apple-ink underline underline-offset-2 dark:text-apple">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
