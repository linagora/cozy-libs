import { Icon, Dropdown, LinkOut, Pen } from '@linagora/twake-icons'
import cx from 'classnames'
import React, { useRef, useState } from 'react'

import { useClient, generateWebLink } from 'cozy-client'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import FolderPickerDialog from './FolderPickerDialog'
import { useWorkspaceFileCount } from './workspaceFiles'
import TDrive from '../../assets/tdrive.png'

/**
 * Composer chip showing the selected assistant's knowledge-base folder,
 * rendered in the "selected source" style (like the email source chip).
 *
 * Clicking stays in-app: it opens a small menu with explicit actions —
 * open the folder in Drive (new tab) or change the knowledge base through
 * the Drive folder picker (persisted on the assistant immediately). The
 * menu also tells how many files of the folder are indexed, fetched each
 * time it opens so the number follows the indexing.
 */
const KnowledgeBaseChip = ({
  dirId,
  folder,
  isRoot,
  isUnavailable,
  isLast,
  onChangeFolder
}) => {
  const { t } = useI18n()
  const client = useClient()
  const chipRef = useRef(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const { fileCount, fetchStatus } = useWorkspaceFileCount(
    isMenuOpen && !isUnavailable ? dirId : null
  )

  const closeMenu = () => setIsMenuOpen(false)

  const handleChangeFolder = () => {
    closeMenu()
    setIsPickerOpen(true)
  }

  const folderUrl = generateWebLink({
    slug: 'drive',
    cozyUrl: client?.getStackClient().uri,
    subDomainType: client?.getInstanceOptions().subdomain,
    hash: `/folder/${dirId}`
  })

  const label = isUnavailable
    ? t('assistant.knowledge_base.unavailable')
    : isRoot
      ? t('assistant.twake_knowledges.drive')
      : (folder?.name ?? '…')

  const indexedLabel =
    fetchStatus !== 'loaded'
      ? null
      : fileCount === null
        ? t('assistant.knowledge_base.not_indexed')
        : t('assistant.knowledge_base.indexed_files', fileCount)

  return (
    <>
      <div ref={chipRef} className={cx({ 'u-mr-half': !isLast })}>
        <Chip
          icon={
            <img
              alt=""
              aria-hidden="true"
              src={TDrive}
              width={16}
              className="u-m-0"
            />
          }
          label={
            <span className="u-flex u-flex-items-center">
              {label}
              <Icon icon={Dropdown} size={16} className="u-ml-half" />
            </span>
          }
          variant="ghost"
          clickable
          onClick={() => setIsMenuOpen(true)}
          className="u-w-auto u-ph-half u-mr-0"
        />
      </div>
      {isMenuOpen && (
        <ActionsMenu
          open
          ref={chipRef}
          onClose={closeMenu}
          actions={[]}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          {indexedLabel && (
            <Typography
              variant="caption"
              color="textSecondary"
              className="u-ph-1 u-pb-half"
              component="div"
              data-testid="knowledge-base-indexed-files"
            >
              {indexedLabel}
            </Typography>
          )}
          {!isUnavailable && (
            <ActionsMenuItem
              component="a"
              href={folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              <div className="u-flex u-flex-items-center">
                <Icon icon={LinkOut} size={16} className="u-mr-half" />
                <Typography variant="body1">
                  {t('assistant.knowledge_base.open_folder')}
                </Typography>
              </div>
            </ActionsMenuItem>
          )}
          <ActionsMenuItem onClick={handleChangeFolder}>
            <div className="u-flex u-flex-items-center">
              <Icon icon={Pen} size={16} className="u-mr-half" />
              <Typography variant="body1">
                {t('assistant.knowledge_base.change_folder')}
              </Typography>
            </div>
          </ActionsMenuItem>
        </ActionsMenu>
      )}
      {isPickerOpen && (
        <FolderPickerDialog
          open={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={onChangeFolder}
        />
      )}
    </>
  )
}

export default KnowledgeBaseChip
