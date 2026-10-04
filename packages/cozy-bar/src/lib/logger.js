import _minilog from '@cozy/minilog'

import flag from 'cozy-flags'

window.cozy = window.cozy || {}
window.cozy.debug = window.cozy.debug || {}
window.cozy.debug.flagship = () => flag('flagship.debug', true)

const minilog = window.minilog || _minilog
const logger = minilog('cozy-bar')

if (!flag('bar.debug')) {
  minilog.suggest.deny('cozy-bar', 'info')
}

export default logger
