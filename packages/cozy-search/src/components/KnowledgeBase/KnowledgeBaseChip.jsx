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
import TDrive from '../../assets/tdrive.png'

/**
 * Composer chip showing the selected assistant's knowledge-base folder,
 * rendered in the "selected source" style (like the demo mail/chat chips).
 *
 * Clicking stays in-app: it opens a small menu with explicit actions —
 * open the folder in Drive (new tab) or change the knowledge base through
 * the Drive folder picker (persisted on the assistant immediately).
 */
const KnowledgeBaseChip = ({
  folderId,
  folder,
  isUnavailable,
  isLast,
  onChangeFolder
}) => {
  const { t } = useI18n()
  const client = useClient()
  const chipRef = useRef(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)

  const handleChangeFolder = () => {
    closeMenu()
    setIsPickerOpen(true)
  }

  const folderUrl = generateWebLink({
    slug: 'drive',
    cozyUrl: client?.getStackClient().uri,
    subDomainType: client?.getInstanceOptions().subdomain,
    hash: `/folder/${folderId}`
  })

  const label = isUnavailable
    ? t('assistant.knowledge_base.unavailable')
    : folder?.name ?? '…'

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
