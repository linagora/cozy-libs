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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Button: any
  export default Button
}

declare module 'cozy-ui/transpiled/react/SearchBar' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SearchBar: any
  export default SearchBar
}

declare module 'cozy-ui/transpiled/react/hooks/useEventListener' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useEventListener: (element: any, event: string, handler: () => void) => void
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PaperplaneIcon: any
  export default PaperplaneIcon
}

declare module 'cozy-ui/transpiled/react/Icons/Stop' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StopIcon: any
  export default StopIcon
}

declare module 'twake-i18n' {
  export function useI18n(): {
    t: (key: string, options?: Record<string, unknown>) => string
    lang: string
  }
  export function useExtendI18n(locales: Record<string, unknown>): void
}

declare module 'cozy-client/dist/models/contact' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getDisplayName(contact: any): string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function getInitials(contact: any): string
}

declare module 'cozy-realtime/dist/useRealtime' {
  interface RealtimeConfig {
    [doctype: string]: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      created?: (doc: any) => void
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updated?: (doc: any) => void
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deleted?: (doc: any) => void
    }
  }

  export default function useRealtime(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: any,
    config: RealtimeConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deps: any[]
  ): void
}
