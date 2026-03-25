import { useEffect } from 'react'

import { useBarContext } from './BarProvider'

function BarRight({ children }) {
  const barContext = useBarContext()

  useEffect(() => {
    if (barContext && barContext.setBarRight !== undefined) {
      barContext.setBarRight(children)
      return () => {
        barContext.setBarRight(null)
      }
    } else {
      console.warn('You should not use BarRight outside of a BarProvider')
    }
  }, [barContext, children])

  return null
}

export { BarRight }
