import React from 'react'

import { useQuery, isQueryLoading } from 'cozy-client'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Icon from 'cozy-ui/transpiled/react/Icon'

import { getDriveMimeTypeIcon } from '../Search/getIconForSearchResult'
import { buildFilesByIds } from '../queries'

const UserMessageAttachments = ({ attachmentIDs }) => {
  const enabled = attachmentIDs.length > 0
  const filesByIds = buildFilesByIds(attachmentIDs, enabled)
  const { data: files, ...queryResult } = useQuery(
    filesByIds.definition,
    filesByIds.options
  )

  if (!enabled || isQueryLoading(queryResult) || !files?.length) return null

  return (
    <div className="u-flex u-flex-wrap u-mt-half">
      {files.map(file => (
        <Chip
          key={file._id}
          label={file.name}
          icon={<Icon icon={getDriveMimeTypeIcon(file)} size={16} />}
          className="u-mr-half u-mb-half"
          style={{ maxWidth: '100%' }}
          classes={{ label: 'u-ellipsis' }}
          size="small"
          variant="ghost"
        />
      ))}
    </div>
  )
}

export default UserMessageAttachments
