import getQueryParameter from './QueryParameter'

describe('getQueryParameter', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('should decode URI string', () => {
    window.history.pushState({}, '', '?username=N%C3%B6%C3%A9')
    const { username } = getQueryParameter()

    expect(username).toBe('Nöé')
  })

  it('should keep string with accent unchanged', () => {
    window.history.pushState({}, '', '?username=Nöé')
    const { username } = getQueryParameter()

    expect(username).toBe('Nöé')
  })

  it('should not modify string with special characters', () => {
    window.history.pushState(
      {},
      '',
      '?sharecode=eyJ_hbGc/iOiJ.S3mJz-B90iu.8D0%23JwCK'
    )
    const { sharecode } = getQueryParameter()

    expect(sharecode).toBe('eyJ_hbGc/iOiJ.S3mJz-B90iu.8D0#JwCK')
  })
})
