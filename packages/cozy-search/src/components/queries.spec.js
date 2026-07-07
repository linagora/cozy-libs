import { buildFileByIdQuery } from './queries'

// Regression test for the lazy `definition` pattern: cozy-client only skips
// resolving a disabled query's definition when it is a function. Using the
// REAL cozy-client `Q` here (no module mock) so a regression to the eager
// `Q(...).getById(fileId)` form — which throws when fileId is null/undefined
// — is actually caught.
describe('buildFileByIdQuery', () => {
  it('does not throw when built with a null fileId', () => {
    expect(() => buildFileByIdQuery(null)).not.toThrow()
  })

  it('disables the query when fileId is null', () => {
    const query = buildFileByIdQuery(null)
    expect(query.options.enabled).toBe(false)
  })
})
