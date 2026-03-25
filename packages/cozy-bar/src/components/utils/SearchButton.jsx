import React, { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Magnifier from 'cozy-ui/transpiled/react/Icons/Magnifier'

const SearchButton = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const goToSearch = useCallback(() => {
    navigate(`/search?returnPath=${pathname}`)
  }, [navigate, pathname])

  return (
    <IconButton onClick={goToSearch}>
      <Icon icon={Magnifier} />
    </IconButton>
  )
}

export default SearchButton
