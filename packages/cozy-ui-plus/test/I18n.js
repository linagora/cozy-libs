'use strict'

import { getI18n } from 'twake-i18n'

export const I18nContext = options =>
  getI18n(options.lang, () => options.locale, undefined, options.defaultLang)
