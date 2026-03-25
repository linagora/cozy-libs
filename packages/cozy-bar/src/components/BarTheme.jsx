import { useEffect } from 'react'

import { useBarContext } from './BarProvider'

function BarTheme({ variant }) {
  const barContext = useBarContext()

  useEffect(() => {
    if (barContext && barContext.setTheme !== undefined) {
      barContext.setThemeVariant(variant)
      return () => {
        barContext.setThemeVariant('normal')
      }
    } else {
      console.warn('You should not use BarTheme outside of a BarProvider')
    }
  }, [barContext, variant])

  return null
}

export { BarTheme }
