import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import AppTitle from 'cozy-ui/transpiled/react/AppTitle'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'

import styles from './styles.styl'

const ConversationHeader = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const onClose = () => {
    try {
      const returnPath = searchParams.get('returnPath')
      if (returnPath) {
        navigate(returnPath)
      } else {
        navigate('..')
      }
    } catch {
      navigate('..')
    }
  }

  return (
    <div className={`u-flex u-ph-1 ${styles['conversationHeaderBar']}`}>
      <div className="u-flex u-w-100 u-flex-items-center u-flex-justify-start">
        <AppTitle slug="home" />
      </div>

      <div className="u-flex u-flex-items-center u-flex-justify-end">
        <IconButton onClick={onClose}>
          <Icon icon={CrossIcon} />
        </IconButton>
      </div>
    </div>
  )
}

export default ConversationHeader
