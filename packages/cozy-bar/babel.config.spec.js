const { execFileSync } = require('child_process')

describe('babel build', () => {
  it('extracts the bar stylesheet instead of leaving a .styl import in dist', () => {
    // Jest runs babel with the CommonJS test env, so the published build is spawned
    const output = execFileSync(
      'yarn',
      ['babel', '--env-name', 'production', 'src/index.jsx'],
      { cwd: __dirname, encoding: 'utf8' }
    )

    expect(output).toContain('BarComponent')
    expect(output).not.toMatch(/\.styl/)
  })
})
