import { Icon, Cross } from '@linagora/twake-icons'
import cx from 'classnames'
import React from 'react'

import { useClient, generateWebLink } from 'cozy-client'
import Chip from 'cozy-ui/transpiled/react/Chips'
import { useI18n } from 'twake-i18n'

import TDrive from '../../assets/tdrive.png'

// MUI Chip's own `cursor: default` rule loads after the utility stylesheet
// and ties `u-c-pointer` on specificity, so only an inline style wins.
const styles = { pointer: { cursor: 'pointer' } }

/**
 * Composer chip showing the selected assistant's knowledge-base folder,
 * rendered in the "selected source" style (like the demo mail/chat chips).
 * Clicking opens the real Drive app on that folder in a new tab — that is
 * where file management (rename, move, upload) happens. The cross removes
 * the knowledge base from the assistant.
 */
const KnowledgeBaseChip = ({
  folderId,
  folder,
  isUnavailable,
  isLast,
  onRemove
}) => {
  const { t } = useI18n()
  const client = useClient()

  const chipIcon = (
    <img alt="" aria-hidden="true" src={TDrive} width={16} className="u-m-0" />
  )

  const deleteIcon = (
    <Icon
      icon={Cross}
      size={16}
      aria-label={t('assistant.knowledge_base.remove')}
      style={{
        height: 16,
        width: 16,
        marginLeft: 10,
        marginRight: 0
      }}
      color="var(--primaryColor)"
    />
  )

  const handleDelete = event => {
    // the chip is an anchor: keep the cross from triggering navigation
    event.preventDefault()
    onRemove()
  }

  if (isUnavailable) {
    return (
      <Chip
        icon={chipIcon}
        label={t('assistant.knowledge_base.unavailable')}
        deleteIcon={deleteIcon}
        onDelete={onRemove}
        variant="ghost"
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
      deleteIcon={deleteIcon}
      onDelete={handleDelete}
      variant="ghost"
      component="a"
      // MUI forces role="button" on deletable chips; this chip really is a link
      role="link"
      href={folderUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cx('u-w-auto u-ph-half u-mr-0', {
        'u-mr-half': !isLast
      })}
      style={styles.pointer}
    />
  )
}

export default KnowledgeBaseChip
