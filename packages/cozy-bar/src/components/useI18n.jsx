import deLocale from 'locales/de.json'
import enLocale from 'locales/en.json'
import esLocale from 'locales/es.json'
import frLocale from 'locales/fr.json'
import itLocale from 'locales/it.json'
import ruLocale from 'locales/ru.json'
import viLocale from 'locales/vi.json'

import { createUseI18n } from 'twake-i18n'

const locales = {
  de: deLocale,
  en: enLocale,
  es: esLocale,
  fr: frLocale,
  it: itLocale,
  ru: ruLocale,
  vi: viLocale
}

const useI18n = createUseI18n(locales)

export default useI18n
