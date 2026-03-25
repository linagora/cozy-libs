import { createUseI18n } from 'twake-i18n'

import enLocale from 'locales/en.json'
import frLocale from 'locales/fr.json'
import esLocale from 'locales/es.json'
import ruLocale from 'locales/ru.json'
import viLocale from 'locales/vi.json'

const locales = {
  en: enLocale,
  fr: frLocale,
  es: esLocale,
  ru: ruLocale,
  vi: viLocale
}

const useI18n = createUseI18n(locales)

export default useI18n
