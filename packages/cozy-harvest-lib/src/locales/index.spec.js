import { getBoundT } from './index'

describe('bound t', () => {
  it('should be possible to get a t bound to harvest locales', () => {
    const t = getBoundT('en')
    expect(t('card.launchTrigger.button.label')).toBe('Synchronize')
  })

  it.each([
    ['es', 'Sincronizar'],
    ['de', 'Synchronisieren'],
    ['it', 'Sincronizza']
  ])('should be possible to get a t bound to the %s locale', (lang, label) => {
    const t = getBoundT(lang)
    expect(t('card.launchTrigger.button.label')).toBe(label)
  })
})
