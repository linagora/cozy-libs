import cozyUiUtilsCss from 'cozy-ui/dist/cozy-ui.utils.min.css'
import cozyUiCss from 'cozy-ui/transpiled/react/stylesheet.css'
import cozyUiPlusCss from 'cozy-ui-plus/dist/stylesheet.css'

import barCss from '../styles/index.styl'

const FONTS_LINK_ID = 'twake-bar-fonts'

// Nothing matches `html` or `:root` inside a shadow root: move the global
// custom properties of the stylesheets to the shadow host.
const scopeToShadowHost = css =>
  css.replace(/(^|[{},\s>+~])(?::root|html)(?=[\s,{.:[>+~])/g, '$1:host')

// The host element belongs to the page, which positions it in the space it
// reserves: its `:host` rules are defaults the page styles win over. The bar
// containers are reset instead, so that the properties they would inherit from
// the page (e.g. `* { color: red }`) do not reach the bar. They then get the
// typography a Cozy app page gives the bar: the `body` rules of cozy-ui match
// nothing in a shadow root.
const HOST_CSS =
  ':host{display:block;height:3rem}' +
  ':host>div{all:initial;display:block;font-family:var(--primaryFont);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}' +
  ':host button,:host input,:host optgroup,:host select,:host textarea{font-family:var(--primaryFont)}'

const shadowStyleSheet = [cozyUiCss, cozyUiUtilsCss, cozyUiPlusCss, barCss]
  .map(scopeToShadowHost)
  .concat(HOST_CSS)
  .join('\n')

const THEME_NODES = ['.TwakeTheme--light', '.TwakeTheme--dark']

// Returns the custom properties declared on `selectors`, in source order
const getVariablesRules = (css, selectors) =>
  [...css.matchAll(/(?:^|})([^{}@]+)\{([^{}]*)\}/g)]
    .filter(([, ruleSelectors]) =>
      ruleSelectors.split(',').some(s => selectors.includes(s.trim()))
    )
    .map(([, , body]) =>
      body
        .split(';')
        .filter(declaration => declaration.trim().startsWith('--'))
        .join(';')
    )

/**
 * cozy-ui builds its MUI palette when its modules are evaluated, by reading
 * CSS variables on hidden `.TwakeTheme--light|dark` nodes it prepends to
 * document.body. Those variables must therefore exist in the document, not
 * only in the shadow root. They are scoped to these nodes so they do not affect
 * the host page.
 */
export function injectThemeVariables() {
  const css = cozyUiCss + cozyUiUtilsCss
  // Variables inherited from the root come before the theme ones
  const rootRules = getVariablesRules(css, ['html', ':root']).map(
    body => `${THEME_NODES.join(',')}{${body}}`
  )
  const themeRules = THEME_NODES.flatMap(node =>
    getVariablesRules(css, [node]).map(body => `${node}{${body}}`)
  )
  const style = document.createElement('style')
  style.textContent = rootRules.concat(themeRules).join('')
  document.head.appendChild(style)
}

let adoptedCss = ''

/**
 * Moves into the shadow root the styles that the bar dependencies appended to
 * the head when evaluated, like @linagora/twake-icons does.
 *
 * @param {Set<Element>} headBefore - Head children before the evaluation
 */
export function adoptHeadStyles(headBefore) {
  for (const style of document.head.querySelectorAll('style')) {
    if (!headBefore.has(style)) {
      adoptedCss += style.textContent
      style.remove()
    }
  }
}

export const getShadowStyleSheet = () => shadowStyleSheet + adoptedCss

/**
 * @font-face rules are ignored inside a shadow root by some browsers, so the
 * Inter font served by the stack is declared in the document.
 *
 * @param {string} cozyURL - URL of the Cozy stack
 */
export function injectFonts(cozyURL) {
  if (document.getElementById(FONTS_LINK_ID)) return
  // A second Inter face loaded later would redraw the text of the bar
  const hasInter = [...document.fonts].some(
    font => font.family.replace(/["']/g, '') === 'Inter'
  )
  if (hasInter) return
  const link = document.createElement('link')
  link.id = FONTS_LINK_ID
  link.rel = 'stylesheet'
  link.href = new URL('/assets/fonts/fonts.css', cozyURL).href
  document.head.appendChild(link)
}
