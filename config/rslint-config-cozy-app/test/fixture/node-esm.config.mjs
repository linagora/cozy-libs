import { define } from 'rstack'

import basics from '../../basics.js'
import nodeEsm from '../../node-esm.js'

define.lint(lint => [...basics(lint), ...nodeEsm()])
