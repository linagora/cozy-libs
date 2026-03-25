import React, {
  createContext,
  useContext,
  useState,
  memo,
  useMemo
} from 'react'

const BarContext = createContext()

/**
 * This provider allows you to hide banners while browsing the site
 */
const BarProvider = ({ children }) => {
  const [barCenter, setBarCenter] = useState(null)
  const [barRight, setBarRight] = useState(null)
  const [barLeft, setBarLeft] = useState(null)
  const [barSearch, setBarSearch] = useState(null)
  const [themeVariant, setThemeVariant] = useState('normal')

  const value = useMemo(
    () => ({
      barCenter,
      setBarCenter,
      barRight,
      setBarRight,
      barLeft,
      setBarLeft,
      barSearch,
      setBarSearch,
      themeVariant,
      setThemeVariant
    }),
    [barCenter, barLeft, barRight, barSearch, themeVariant]
  )

  return <BarContext.Provider value={value}>{children}</BarContext.Provider>
}

const useBarContext = () => useContext(BarContext)

export { BarContext, useBarContext }

export default memo(BarProvider)
