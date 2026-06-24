import { Icon, Magnifier } from '@linagora/twake-icons'
import React, { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import IconButton from 'cozy-ui/transpiled/react/IconButton'

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
