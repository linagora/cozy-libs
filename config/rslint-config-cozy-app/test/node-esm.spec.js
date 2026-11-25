import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'

const fixture = join(import.meta.dirname, 'fixture')
// rstack, a peer of this package, from the node_modules of the repository
const rstack = createRequire(import.meta.url).resolve('rstack/package.json')
const rs = join(dirname(rstack), 'bin/rs.js')

// The exit code of `rs lint` on the fixture with one of its configs, and the
// rules it reports
const lint = config => {
  const { status, stdout } = spawnSync(
    process.execPath,
    [rs, 'lint', '-c', config, '--format', 'jsonline', 'importer.js'],
    { cwd: fixture, encoding: 'utf8' }
  )
  const rules = stdout
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line).ruleName)
  return { status, rules }
}

describe('node-esm', () => {
  it('reports a relative import without its extension', () => {
    assert.ok(
      lint('node-esm.config.mjs').rules.includes(
        'node/file-extension-in-import'
      )
    )
  })

  it('leaves the default config without the rule', () => {
    const { status, rules } = lint('basics.config.mjs')
    // 0: rs ran and found nothing, not a crash that printed nothing
    assert.equal(status, 0)
    assert.ok(!rules.includes('node/file-extension-in-import'))
  })
})
