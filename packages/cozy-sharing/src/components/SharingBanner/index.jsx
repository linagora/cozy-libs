import PropTypes from 'prop-types'
import React from 'react'

import { useClient } from 'cozy-client'

import withLocales from '../../hoc/withLocales'
import { SharingBanner } from './components/SharingBanner'
import { useSharingInfos } from './hooks/useSharingInfos'

const Plugin = ({ previewPath, hideCreateCozyAction }) => {
  const client = useClient()
  const sharingInfos = useSharingInfos(previewPath)
  return (
    <SharingBanner
      sharingInfos={sharingInfos}
      avatarURL={`${client.options.uri}/public/avatar?fallback=initials`}
      hideCreateCozyAction={hideCreateCozyAction}
    />
  )
}

Plugin.propTypes = {
  previewPath: PropTypes.string,
  hideCreateCozyAction: PropTypes.bool
}

export const SharingBannerPlugin = withLocales(Plugin)
