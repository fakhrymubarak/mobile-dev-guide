import { useTranslation } from 'react-i18next'
import { PlatformBadge } from '../components/PlatformBadge'
import { useExplain } from '../components/Explainer'
import type { Platform } from '../engine'
import { Card, PageHeader } from './LearnLayout'

interface FNode {
  x: number
  y: number
  w?: number
  label: string
  kind: 'callback' | 'state' | 'terminal'
  cid?: string
}
interface FEdge {
  d: string
  label?: string
  lx?: number
  ly?: number
  anchor?: 'start' | 'middle' | 'end'
  cid?: string
  dashed?: boolean
}
interface FGroup {
  x: number
  y: number
  w: number
  h: number
  label: string
}

const H = 34

const COLORS = {
  android: { cb: 'fill-droid/15 stroke-droid-ink dark:stroke-droid', link: 'fill-droid-ink dark:fill-droid' },
  ios: { cb: 'fill-apple/15 stroke-apple-ink dark:stroke-apple', link: 'fill-apple-ink dark:fill-apple' },
}

function Flow({ platform, lane, width, height, nodes, edges, groups = [], title }: {
  platform: Platform
  lane: string
  width: number
  height: number
  nodes: FNode[]
  edges: FEdge[]
  groups?: FGroup[]
  title: string
}) {
  const explain = useExplain()
  const c = COLORS[platform]
  const open = (cid: string, label: string) => explain({ kind: 'callback', platform, cid, label, lane })
  const markerId = `arrow-${platform}-${lane}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="diagram h-auto w-full" role="img" aria-label={title}>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className="fill-slate-400 dark:fill-slate-500" />
        </marker>
      </defs>
      {groups.map((g) => (
        <g key={g.label}>
          <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={14} className="fill-slate-100 stroke-slate-300 dark:fill-slate-800/60 dark:stroke-slate-700" strokeDasharray="4 4" />
          <text x={g.x + 12} y={g.y + 18} className="fill-slate-500 text-[11px] font-semibold tracking-wider uppercase">
            {g.label}
          </text>
        </g>
      ))}
      {edges.map((e, i) => (
        <g key={i}>
          <path d={e.d} fill="none" className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={1.6} strokeDasharray={e.dashed ? '5 4' : undefined} markerEnd={`url(#${markerId})`} />
          {e.label && (
            <text
              x={e.lx}
              y={e.ly}
              textAnchor={e.anchor ?? 'middle'}
              onClick={e.cid ? () => open(e.cid!, e.label!.replace('\n', ' ')) : undefined}
              className={`text-[11px] ${e.cid ? `${c.link} cursor-pointer font-mono font-semibold hover:underline` : 'fill-slate-500 italic'}`}
            >
              {e.label.split('\n').map((line, j) => (
                <tspan key={j} x={e.lx} dy={j ? 13 : 0}>
                  {line}
                </tspan>
              ))}
            </text>
          )}
        </g>
      ))}
      {nodes.map((n) => {
        const w = n.w ?? 170
        const cls =
          n.kind === 'callback'
            ? `${c.cb} ${n.cid ? 'cursor-pointer' : ''}`
            : n.kind === 'state'
              ? 'fill-white stroke-slate-400 dark:fill-slate-900 dark:stroke-slate-500'
              : 'fill-slate-800 stroke-slate-800 dark:fill-slate-200 dark:stroke-slate-200'
        return (
          <g
            key={n.label}
            onClick={n.cid ? () => open(n.cid!, n.label) : undefined}
            className={n.cid ? 'group cursor-pointer' : ''}
            role={n.cid ? 'button' : undefined}
            tabIndex={n.cid ? 0 : undefined}
            onKeyDown={n.cid ? (ev) => (ev.key === 'Enter' || ev.key === ' ') && open(n.cid!, n.label) : undefined}
          >
            <rect x={n.x - w / 2} y={n.y - H / 2} width={w} height={H} rx={n.kind === 'callback' ? 17 : 8} strokeWidth={1.5} className={`${cls} transition group-hover:stroke-[2.5]`} />
            <text
              x={n.x}
              y={n.y + 4}
              textAnchor="middle"
              className={`text-[12px] ${n.kind === 'callback' ? 'fill-slate-900 font-mono font-semibold dark:fill-white' : n.kind === 'terminal' ? 'fill-white font-semibold dark:fill-slate-900' : 'fill-slate-800 font-semibold dark:fill-slate-100'}`}
            >
              {n.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Vertical arrows between nodes stacked in one column. */
const down = (x: number, ys: number[]): FEdge[] => ys.slice(0, -1).map((y, i) => ({ d: `M${x},${y + H / 2} V${ys[i + 1] - H / 2 - 2}` }))

export function LifecycleDiagrams() {
  const { t } = useTranslation()

  const activity = (
    <Flow
      platform="android"
      lane="activity"
      title={t('lc.activity')}
      width={680}
      height={530}
      nodes={[
        { x: 320, y: 24, label: t('lc.launched'), kind: 'terminal' },
        { x: 320, y: 84, label: 'onCreate()', kind: 'callback', cid: 'a.onCreate' },
        { x: 320, y: 144, label: 'onStart()', kind: 'callback', cid: 'a.onStart' },
        { x: 320, y: 204, label: 'onResume()', kind: 'callback', cid: 'a.onResume' },
        { x: 320, y: 264, label: t('lc.running'), kind: 'state' },
        { x: 320, y: 324, label: 'onPause()', kind: 'callback', cid: 'a.onPause' },
        { x: 320, y: 384, label: 'onStop()', kind: 'callback', cid: 'a.onStop' },
        { x: 320, y: 444, label: 'onDestroy()', kind: 'callback', cid: 'a.onDestroy' },
        { x: 320, y: 504, label: t('lc.shutdown'), kind: 'terminal' },
        { x: 560, y: 264, w: 130, label: 'onRestart()', kind: 'callback', cid: 'a.onRestart' },
        { x: 95, y: 324, w: 140, label: t('lc.killed'), kind: 'state', cid: 'p.killed' },
      ]}
      edges={[
        ...down(320, [24, 84, 144, 204, 264, 324, 384, 444, 504]),
        { d: 'M405,324 H460 V204 H409', label: t('lc.userReturns'), lx: 466, ly: 232, anchor: 'start' },
        { d: 'M405,384 H560 V283', label: t('lc.userNavigates'), lx: 566, ly: 340, anchor: 'start' },
        { d: 'M560,247 V144 H409' },
        { d: 'M235,384 H95 V343', label: t('lc.otherApp'), lx: 100, ly: 412, anchor: 'middle', dashed: true },
        { d: 'M95,307 V84 H231', label: t('lc.userNavigates'), lx: 101, ly: 200, anchor: 'start' },
      ]}
    />
  )

  const compose = (
    <Flow
      platform="android"
      lane="compose"
      title={t('lc.compose')}
      width={680}
      height={210}
      nodes={[
        { x: 110, y: 60, label: 'enters composition', kind: 'callback', cid: 'c.enter' },
        { x: 340, y: 60, label: 'recomposition 0…n', kind: 'callback', cid: 'c.recompose' },
        { x: 570, y: 60, label: 'leaves composition', kind: 'callback', cid: 'c.leave' },
        { x: 95, y: 160, w: 150, label: '{ onStart }', kind: 'callback', cid: 'c.start' },
        { x: 255, y: 160, w: 150, label: '{ onResume }', kind: 'callback', cid: 'c.resume' },
        { x: 425, y: 160, w: 170, label: 'onPauseOrDispose', kind: 'callback', cid: 'c.pause' },
        { x: 595, y: 160, w: 160, label: 'onStopOrDispose', kind: 'callback', cid: 'c.stop' },
      ]}
      edges={[
        { d: 'M195,60 H251' },
        { d: 'M425,60 H481' },
        { d: 'M320,43 C320,0 360,0 360,41' },
        { d: 'M170,160 H176' },
        { d: 'M330,160 H336' },
        { d: 'M510,160 H511' },
        { d: 'M340,77 V100', label: 'LifecycleStartEffect · LifecycleResumeEffect', lx: 340, ly: 125, dashed: true },
      ]}
    />
  )

  const iosApp = (
    <Flow
      platform="ios"
      lane="app"
      title={t('lc.iosApp')}
      width={680}
      height={420}
      groups={[
        { x: 60, y: 92, w: 520, h: 100, label: 'Foreground' },
        { x: 60, y: 252, w: 520, h: 100, label: 'Background' },
      ]}
      nodes={[
        { x: 340, y: 30, w: 160, label: t('lc.notRunning'), kind: 'terminal' },
        { x: 200, y: 145, label: 'Inactive', kind: 'state', cid: 'a.inactive' },
        { x: 480, y: 145, label: 'Active', kind: 'state', cid: 'a.active' },
        { x: 200, y: 305, label: 'Background', kind: 'state', cid: 'a.background' },
        { x: 480, y: 305, label: 'Suspended', kind: 'state', cid: 'a.suspended' },
      ]}
      edges={[
        { d: 'M260,30 H30 V145 H111', label: 'didFinishLaunching', lx: 36, ly: 82, anchor: 'start', cid: 'a.didFinishLaunching' },
        { d: 'M285,137 H391', label: 'sceneDidBecomeActive', lx: 340, ly: 121, cid: 's.didBecomeActive' },
        { d: 'M395,153 H289', label: 'sceneWillResignActive', lx: 340, ly: 180, cid: 's.willResignActive' },
        { d: 'M180,162 V284', label: 'sceneDidEnterBackground', lx: 174, ly: 228, anchor: 'end', cid: 's.didEnterBackground' },
        { d: 'M220,288 V166', label: 'sceneWillEnterForeground', lx: 226, ly: 228, anchor: 'start', cid: 's.willEnterForeground' },
        { d: 'M285,297 H391', label: '(no callback)', lx: 340, ly: 289, cid: 'a.suspended' },
        { d: 'M395,313 H289', label: t('lc.userReturns'), lx: 340, ly: 334 },
        { d: 'M480,322 V395 H640 V30 H424', label: 'jetsam — no callback', lx: 634, ly: 215, anchor: 'end', cid: 'a.jetsam', dashed: true },
      ]}
    />
  )

  const vc = (
    <Flow
      platform="ios"
      lane="viewController"
      title={t('lc.vc')}
      width={680}
      height={200}
      nodes={[
        { x: 90, y: 40, w: 150, label: 'viewDidLoad', kind: 'callback', cid: 'vc.viewDidLoad' },
        { x: 255, y: 40, w: 150, label: 'viewWillAppear', kind: 'callback', cid: 'vc.viewWillAppear' },
        { x: 425, y: 40, w: 160, label: 'viewIsAppearing', kind: 'callback', cid: 'vc.viewIsAppearing' },
        { x: 590, y: 40, w: 150, label: 'viewDidAppear', kind: 'callback', cid: 'vc.viewDidAppear' },
        { x: 590, y: 150, w: 170, label: 'viewWillDisappear', kind: 'callback', cid: 'vc.viewWillDisappear' },
        { x: 400, y: 150, w: 170, label: 'viewDidDisappear', kind: 'callback', cid: 'vc.viewDidDisappear' },
        { x: 200, y: 150, w: 120, label: 'deinit', kind: 'callback', cid: 'vc.deinit' },
      ]}
      edges={[
        { d: 'M165,40 H176' },
        { d: 'M330,40 H341' },
        { d: 'M505,40 H511' },
        { d: 'M590,57 V129' },
        { d: 'M505,150 H489' },
        { d: 'M315,150 H264' },
        { d: 'M370,133 L275,59', label: 'shown again', lx: 300, ly: 105, anchor: 'end' },
      ]}
    />
  )

  const swiftui = (
    <Flow
      platform="ios"
      lane="swiftui"
      title={t('lc.swiftui')}
      width={680}
      height={180}
      nodes={[
        { x: 90, y: 40, w: 150, label: 'init (cheap)', kind: 'state' },
        { x: 255, y: 40, w: 150, label: 'onAppear · task', kind: 'callback', cid: 'sw.onAppear' },
        { x: 425, y: 40, w: 150, label: 'body updates', kind: 'callback', cid: 'sw.body' },
        { x: 590, y: 40, w: 150, label: 'onDisappear', kind: 'callback', cid: 'sw.onDisappear' },
        { x: 255, y: 140, w: 130, label: '.active', kind: 'state', cid: 'ph.active' },
        { x: 425, y: 140, w: 130, label: '.inactive', kind: 'state', cid: 'ph.inactive' },
        { x: 590, y: 140, w: 140, label: '.background', kind: 'state', cid: 'ph.background' },
      ]}
      edges={[
        { d: 'M165,40 H176' },
        { d: 'M330,40 H346' },
        { d: 'M500,40 H511' },
        { d: 'M405,23 C405,-12 445,-12 445,21' },
        { d: 'M320,134 H356' },
        { d: 'M360,146 H324' },
        { d: 'M490,134 H516' },
        { d: 'M520,146 H494' },
        { d: 'M90,57 V140 H186', label: 'scenePhase', lx: 96, ly: 110, anchor: 'start', dashed: true },
      ]}
    />
  )

  const blocks: { platform: Platform; title: string; desc: string; svg: React.ReactNode }[] = [
    { platform: 'android', title: t('lc.activity'), desc: t('lc.activity.d'), svg: activity },
    { platform: 'ios', title: t('lc.iosApp'), desc: t('lc.iosApp.d'), svg: iosApp },
    { platform: 'android', title: t('lc.compose'), desc: t('lc.compose.d'), svg: compose },
    { platform: 'ios', title: t('lc.vc'), desc: t('lc.vc.d'), svg: vc },
    { platform: 'ios', title: t('lc.swiftui'), desc: t('lc.swiftui.d'), svg: swiftui },
  ]

  return (
    <>
      <PageHeader title={t('lc.title')} lead={t('lc.lead')} />
      <div className="grid gap-5 2xl:grid-cols-2">
        {blocks.map((b) => (
          <Card key={b.title}>
            <div className="mb-1 flex items-center gap-2">
              <PlatformBadge platform={b.platform} />
              <h2 className="text-lg font-bold">{b.title}</h2>
            </div>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{b.desc}</p>
            {b.svg}
          </Card>
        ))}
      </div>
    </>
  )
}
