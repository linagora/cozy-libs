import fs from 'fs'
import path from 'path'

// The `ai-chat-ui.ts` entry is the contract consumed by standalone (non-Cozy)
// apps: nothing it pulls in — TRANSITIVELY — may depend on the Cozy backend.
// A shallow "does this one file import cozy-*" check is not enough, because a
// pure-looking view can render a child that imports cozy-client. So we walk the
// full static import graph starting from ai-chat-ui.ts and assert no reachable
// module imports a forbidden package.
const SRC = path.join(__dirname, '..')
const ENTRY = path.join(SRC, 'ai-chat-ui.ts')

const FORBIDDEN = [
  'cozy-client',
  'cozy-stack-client',
  'cozy-realtime',
  'cozy-flags',
  'cozy-device-helper',
  'cozy-dataproxy-lib'
]

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

// Resolve a relative import specifier to a real file on disk.
const resolveLocal = (fromFile: string, spec: string): string | undefined => {
  const base = path.resolve(path.dirname(fromFile), spec)
  const candidates = [
    base,
    ...EXTENSIONS.map(ext => base + ext),
    ...EXTENSIONS.map(ext => path.join(base, 'index' + ext))
  ]
  return candidates.find(c => fs.existsSync(c) && fs.statSync(c).isFile())
}

// Every module specifier referenced by `import ... from '...'`,
// `export ... from '...'`, and side-effect `import '...'`.
const specifiersOf = (src: string): string[] => {
  const specs: string[] = []
  const fromRe = /from\s*['"]([^'"]+)['"]/g
  const bareRe = /(?:^|[\n;])\s*import\s+['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = fromRe.exec(src))) specs.push(m[1])
  while ((m = bareRe.exec(src))) specs.push(m[1])
  return specs
}

const isForbidden = (spec: string): string | undefined =>
  FORBIDDEN.find(pkg => spec === pkg || spec.startsWith(`${pkg}/`))

const findViolations = (
  entry: string
): { file: string; pkg: string; chain: string[] }[] => {
  const seen = new Set<string>()
  const violations: { file: string; pkg: string; chain: string[] }[] = []

  const walk = (file: string, chain: string[]): void => {
    if (seen.has(file)) return
    seen.add(file)
    const src = fs.readFileSync(file, 'utf8')
    for (const spec of specifiersOf(src)) {
      const pkg = isForbidden(spec)
      if (pkg) {
        violations.push({ file, pkg, chain: [...chain, file] })
        continue
      }
      if (spec.startsWith('.')) {
        const resolved = resolveLocal(file, spec)
        // Only follow code modules; skip resolved assets like .styl / images.
        if (resolved && EXTENSIONS.includes(path.extname(resolved))) {
          walk(resolved, [...chain, file])
        }
      }
    }
  }

  walk(entry, [])
  return violations
}

describe('ai-chat-ui entry purity', () => {
  it('ai-chat-ui.ts depends on no Cozy backend package (transitively)', () => {
    const rel = (f: string): string => path.relative(SRC, f)
    const report = findViolations(ENTRY)
      .map(
        v =>
          `${rel(v.file)} imports "${v.pkg}"\n    via ${v.chain.map(rel).join(' → ')}`
      )
      .join('\n')
    expect(report).toBe('')
  })
})
