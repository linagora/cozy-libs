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
declare module 'cozy-ui/transpiled/react/Buttons' {
  const Button: any
  export default Button
}

declare module 'cozy-ui/transpiled/react/SearchBar' {
  const SearchBar: any
  export default SearchBar
}

declare module 'cozy-ui/transpiled/react/hooks/useEventListener' {
  const useEventListener: (
    element: any,
    event: string,
    handler: (event: any) => void
  ) => void
  export default useEventListener
}

declare module 'cozy-ui/transpiled/react/providers/Breakpoints' {
  export function useBreakpoints(): {
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
  }
}

declare module 'cozy-ui/transpiled/react/Icons/Paperplane' {
  const PaperplaneIcon: any
  export default PaperplaneIcon
}

declare module 'cozy-ui/transpiled/react/Icons/Stop' {
  const StopIcon: any
  export default StopIcon
}

declare module 'cozy-ui/transpiled/react/Spinner' {
  const Spinner: any
  export default Spinner
}

declare module 'twake-i18n' {
  export function useI18n(): {
    t: (key: string, options?: Record<string, unknown>) => string
    lang: string
  }
  export function useExtendI18n(locales: Record<string, unknown>): void
}

declare module 'cozy-client/dist/models/contact' {
  export function getDisplayName(contact: any): string
  export function getInitials(contact: any): string
}

declare module 'cozy-realtime/dist/useRealtime' {
  interface RealtimeConfig {
    [doctype: string]: {
      created?: (doc: any) => void
      updated?: (doc: any) => void
      deleted?: (doc: any) => void
    }
  }

  export default function useRealtime(
    client: any,
    config: RealtimeConfig,
    deps: any[]
  ): void
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
