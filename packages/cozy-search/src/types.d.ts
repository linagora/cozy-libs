/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Type declarations for modules without TypeScript support
 */

// Stylus modules
declare module '*.styl' {
  const content: Record<string, string>
  export default content
}

// cozy-ui components without proper TypeScript declarations

declare module 'cozy-ui/transpiled/react/SearchBar' {
  const SearchBar: any
  export default SearchBar
}

declare module 'cozy-ui/transpiled/react/providers/Breakpoints' {
  export function useBreakpoints(): {
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
  }
}

declare module 'twake-i18n' {
  export function useI18n(): {
    t: (key: string, options?: Record<string, unknown>) => string
    lang: string
  }
  export function useExtendI18n(locales: Record<string, unknown>): void
}

declare module 'cozy-minilog' {
  interface Minilog {
    debug(...args: any[]): void
    info(...args: any[]): void
    warn(...args: any[]): void
    error(...args: any[]): void
    log(...args: any[]): void
  }

  function Minilog(namespace: string): Minilog
  export default Minilog
}
