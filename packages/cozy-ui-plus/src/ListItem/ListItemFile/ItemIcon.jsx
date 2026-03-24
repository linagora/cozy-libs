import PropTypes from 'prop-types'
import React from 'react'

import { useClient } from 'cozy-client'
import { isNote } from 'cozy-client/dist/models/file'
import Icon from 'cozy-ui/transpiled/react/Icon'
import FiletypeNoteIcon from 'cozy-ui/transpiled/react/Icons/FileTypeNote'
import FiletypeTextIcon from 'cozy-ui/transpiled/react/Icons/FileTypeText'
import Skeleton from 'cozy-ui/transpiled/react/Skeleton'

import FileImageLoader from '../../FileImageLoader'

const ItemIcon = ({ icon, file }) => {
  const client = useClient()

  if (icon) return icon

  return (
    <FileImageLoader
      client={client}
      file={file}
      linkType="tiny"
      render={src => {
        return (
          <div className="u-flex u-w-2 u-h-2 u-flex-items-center u-flex-justify-center">
            {src ? (
              <img
                className="u-w-2 u-h-2"
                style={{ objectFit: 'contain' }}
                src={src}
                alt=""
              />
            ) : (
              <Skeleton
                className="u-w-100 u-h-100"
                variant="rect"
                animation="wave"
              />
            )}
          </div>
        )
      }}
      renderFallback={() => (
        <div className="u-flex u-w-2 u-h-2 u-flex-items-center u-flex-justify-center">
          <Icon icon={isNote(file) ? FiletypeNoteIcon : FiletypeTextIcon} />
        </div>
      )}
    />
  )
}

ItemIcon.propTypes = {
  icon: PropTypes.node,
  file: PropTypes.object
}

export default ItemIcon
