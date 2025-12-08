import React from 'react'

export const useI18n = () => ({
  t: key => key,
  lang: 'en'
})

export const I18nContext = React.createContext({
  t: key => key,
  lang: 'en'
})

// Mock translate HOC
export const translate = () => Component => {
  const Wrapped = props =>
    React.createElement(Component, { ...props, t: key => key })
  Wrapped.displayName = `translate(${
    Component.displayName || Component.name || 'Component'
  })`
  return Wrapped
}

// Mock withLocales HOC
export const withLocales = () => Component => {
  const Wrapped = props =>
    React.createElement(Component, { ...props, t: key => key, f: key => key })
  Wrapped.displayName = `withLocales(${
    Component.displayName || Component.name || 'Component'
  })`
  return Wrapped
}

// Mock withOnlyLocales HOC
export const withOnlyLocales = () => Component => {
  const Wrapped = props =>
    React.createElement(Component, { ...props, t: key => key, f: key => key })
  Wrapped.displayName = `withOnlyLocales(${
    Component.displayName || Component.name || 'Component'
  })`
  return Wrapped
}

// Mock createUseI18n
export const createUseI18n = () => useI18n

// Default export is the I18n component
const I18n = ({ children }) => {
  return React.createElement(
    I18nContext.Provider,
    { value: { t: key => key, lang: 'en' } },
    children
  )
}

export default I18n
