'use strict'

import { getI18n } from 'twake-i18n'

const { t, f } = getI18n('en', lang => require(`../../src/locales/${lang}`))

export const tMock = t

export const fMock = f
