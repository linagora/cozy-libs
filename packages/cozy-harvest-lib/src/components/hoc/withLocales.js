import { withLocales } from 'twake-i18n'
const dictRequire = lang => require(`../../locales/${lang}.json`)

export default withLocales(dictRequire)
