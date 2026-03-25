import { useEffect } from 'react'

import { useBarContext } from './BarProvider'

function BarSearch({ children }) {
  const barContext = useBarContext()

  useEffect(() => {
    if (barContext && barContext.setBarSearch !== undefined) {
      barContext.setBarSearch(children)
      return () => {
        barContext.setBarSearch(null)
      }
    } else {
      console.warn('You should not use BarSearch outside of a BarProvider')
    }
  }, [barContext, children])

  return null
}

export { BarSearch }
