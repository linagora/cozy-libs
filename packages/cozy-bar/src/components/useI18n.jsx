import enLocale from 'locales/en.json'
import frLocale from 'locales/fr.json'
import ruLocale from 'locales/ru.json'
import viLocale from 'locales/vi.json'

import { createUseI18n } from 'twake-i18n'

const locales = {
  en: enLocale,
  fr: frLocale,
  ru: ruLocale,
  vi: viLocale
}

const useI18n = createUseI18n(locales)

export default useI18n
