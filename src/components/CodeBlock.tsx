import { Highlight, themes } from 'prism-react-renderer'
import type { Snippet } from '../content/snippets'

const LANG_LABEL: Record<Snippet['lang'], string> = { kotlin: 'Kotlin', swift: 'Swift', markup: 'XML' }

export function CodeBlock({ snippet }: { snippet: Snippet }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#1e1e2e]">
      <div className="border-b border-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
        {LANG_LABEL[snippet.lang]}
      </div>
      <Highlight theme={themes.vsDark} code={snippet.code} language={snippet.lang}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed">
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, j) => (
                  <span key={j} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}
