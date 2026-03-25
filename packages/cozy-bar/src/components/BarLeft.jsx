import { useEffect } from 'react'

import { useBarContext } from './BarProvider'

function BarLeft({ children }) {
  const barContext = useBarContext()

  useEffect(() => {
    if (barContext && barContext.setBarLeft !== undefined) {
      barContext.setBarLeft(children)
      return () => {
        barContext.setBarLeft(null)
      }
    } else {
      console.warn('You should not use BarLeft outside of a BarProvider')
    }
  }, [barContext, children])

  return null
}

export { BarLeft }
