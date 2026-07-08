import { Icon, LinkOut, Pen } from '@linagora/twake-icons'
import cx from 'classnames'
import React, { useRef, useState } from 'react'

import { useClient, generateWebLink } from 'cozy-client'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import TDrive from '../../assets/tdrive.png'
import { useAssistant } from '../AssistantProvider'

/**
 * Composer chip showing the selected assistant's knowledge-base folder,
 * rendered in the "selected source" style (like the demo mail/chat chips).
 *
 * Clicking stays in-app: it opens a small menu with the folder path and
 * explicit actions — open the folder in Drive (new tab) or change the
 * knowledge base via the edit-assistant dialog. The chip itself never
 * navigates, so it behaves like the other source chips of the row.
 */
const KnowledgeBaseChip = ({ folderId, folder, isUnavailable, isLast }) => {
  const { t } = useI18n()
  const client = useClient()
  const chipRef = useRef(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const {
    selectedAssistantId,
    setAssistantIdInAction,
    setIsOpenEditAssistant
  } = useAssistant()

  const closeMenu = () => setIsMenuOpen(false)

  const handleChangeFolder = () => {
    setAssistantIdInAction(selectedAssistantId)
    setIsOpenEditAssistant(true)
    closeMenu()
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
          label={label}
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
          <div className="u-ph-1 u-pv-half">
            <Typography variant="body1">{label}</Typography>
            {!isUnavailable && folder?.path && (
              <Typography variant="caption" className="u-c-text-secondary">
                {folder.path}
              </Typography>
            )}
          </div>
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
    </>
  )
}

export default KnowledgeBaseChip
