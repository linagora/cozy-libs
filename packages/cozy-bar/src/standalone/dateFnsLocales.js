// Replaces `date-fns/locale` in the standalone bundle: its index is CommonJS,
// so importing a few locales from it bundles all of them. Only the languages
// of the bar are kept.
export { default as enGB } from 'date-fns/locale/en-GB'
export { default as fr } from 'date-fns/locale/fr'
export { default as ru } from 'date-fns/locale/ru'
export { default as vi } from 'date-fns/locale/vi'
// Imported by twake-i18n, but the bar has no Spanish: dates use the default
export const es = undefined
