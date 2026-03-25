import { useEffect } from 'react'

import { useBarContext } from './BarProvider'

function BarCenter({ children }) {
  const barContext = useBarContext()

  useEffect(() => {
    if (barContext && barContext.setBarCenter !== undefined) {
      barContext.setBarCenter(children)
      return () => {
        barContext.setBarCenter(null)
      }
    } else {
      console.warn('You should not use BarCenter outside of a BarProvider')
    }
  }, [barContext, children])

  return null
}

export { BarCenter }
