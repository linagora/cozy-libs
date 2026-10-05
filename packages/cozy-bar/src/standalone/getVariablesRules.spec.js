import { getVariablesRules } from './getVariablesRules'

describe('getVariablesRules', () => {
  it('should return the variables of adjacent rules', () => {
    const css =
      'html,.TwakeTheme--light{--a:1;color:red}.TwakeTheme--dark{--a:2}html{--b:3}'

    expect(getVariablesRules(css, ['.TwakeTheme--dark'])).toEqual(['--a:2'])
    expect(getVariablesRules(css, ['html'])).toEqual(['--a:1', '--b:3'])
  })
})
