import cx from 'classnames'
import React from 'react'

import { useClient, generateWebLink } from 'cozy-client'
import Chip from 'cozy-ui/transpiled/react/Chips'
import { useI18n } from 'twake-i18n'

import TDrive from '../../assets/tdrive.png'

/**
 * Composer chip showing the selected assistant's knowledge-base folder.
 * Clicking opens the real Drive app on that folder in a new tab — that is
 * where file management (rename, move, upload) happens.
 */
const KnowledgeBaseChip = ({ folderId, folder, isUnavailable, isLast }) => {
  const { t } = useI18n()
  const client = useClient()

  const chipIcon = (
    <img alt="" aria-hidden="true" src={TDrive} width={16} className="u-m-0" />
  )

  if (isUnavailable) {
    return (
      <Chip
        icon={chipIcon}
        label={t('assistant.knowledge_base.unavailable')}
        disabled
        className={cx('u-w-auto u-ph-half u-mr-0', { 'u-mr-half': !isLast })}
      />
    )
  }

  const folderUrl = generateWebLink({
    slug: 'drive',
    cozyUrl: client?.getStackClient().uri,
    subDomainType: client?.getInstanceOptions().subdomain,
    hash: `/folder/${folderId}`
  })

  return (
    <Chip
      icon={chipIcon}
      label={folder?.name ?? '…'}
      component="a"
      href={folderUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('assistant.knowledge_base.open_folder')}
      className={cx('u-w-auto u-ph-half u-mr-0', { 'u-mr-half': !isLast })}
    />
  )
}

export default KnowledgeBaseChip
