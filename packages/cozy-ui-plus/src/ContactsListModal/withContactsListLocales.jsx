import { withLocales } from 'twake-i18n'

import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import it from './locales/it.json'

export const locales = {
  de,
  en,
  es,
  fr,
  it
}

export const withContactsListLocales = withLocales(locales)
