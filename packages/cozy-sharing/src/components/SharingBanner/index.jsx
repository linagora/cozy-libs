import PropTypes from 'prop-types'
import React from 'react'

import { SharingBanner } from './components/SharingBanner'
import { useSharingInfos } from './hooks/useSharingInfos'
import withLocales from '../../hoc/withLocales'

const Plugin = ({ previewPath, hideCreateCozyAction }) => {
  const sharingInfos = useSharingInfos(previewPath)
  return (
    <SharingBanner
      sharingInfos={sharingInfos}
      hideCreateCozyAction={hideCreateCozyAction}
    />
  )
}

Plugin.propTypes = {
  previewPath: PropTypes.string,
  hideCreateCozyAction: PropTypes.bool
}

export const SharingBannerPlugin = withLocales(Plugin)
