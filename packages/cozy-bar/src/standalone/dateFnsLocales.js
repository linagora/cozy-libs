// Replaces `date-fns/locale` in the standalone bundle: its index is CommonJS,
// so importing a few locales from it bundles all of them. Only the languages
// of the bar are kept.
// twake-i18n formats dates in these languages only, so German and Italian dates
// use its default.
export { default as enGB } from 'date-fns/locale/en-GB'
export { default as es } from 'date-fns/locale/es'
export { default as fr } from 'date-fns/locale/fr'
export { default as ru } from 'date-fns/locale/ru'
export { default as vi } from 'date-fns/locale/vi'
