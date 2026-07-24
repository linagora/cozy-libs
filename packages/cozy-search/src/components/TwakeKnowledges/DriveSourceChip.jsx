import { Icon, Dropdown, LinkOut, Pen } from '@linagora/twake-icons'
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
import { getDocId } from '../KnowledgeBase/attachments'
import FolderPickerDialog from '../KnowledgeBase/FolderPickerDialog'

/**
 * Default-assistant Drive chip: by default it stands for "search in all my
 * documents"; through its menu the user can restrict the search to a Drive
 * folder and/or files for the current conversation (sent as attachmentIDs).
 */
const DriveSourceChip = ({ conversationId, isLast }) => {
  const { t } = useI18n()
  const client = useClient()
  const chipRef = useRef(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const {
    attachmentsSelections,
    attachmentsResolutions,
    setAttachmentsSelection
  } = useAssistant()

  const selection = attachmentsSelections[conversationId] ?? []
  const resolution = attachmentsResolutions[conversationId]
  const hasSelection = selection.length > 0

  const closeMenu = () => setIsMenuOpen(false)

  const handleChoose = () => {
    closeMenu()
    setIsPickerOpen(true)
  }

  const handleReset = () => {
    closeMenu()
    setAttachmentsSelection(conversationId, null)
  }

  const singleDirectory =
    selection.length === 1 && selection[0].type === 'directory'
      ? selection[0]
      : null
  const folderUrl = singleDirectory
    ? generateWebLink({
        slug: 'drive',
        cozyUrl: client?.getStackClient().uri,
        subDomainType: client?.getInstanceOptions().subdomain,
        hash: `/folder/${getDocId(singleDirectory)}`
      })
    : null

  const label = !hasSelection
    ? t('assistant.twake_knowledges.drive')
    : resolution?.isUnavailable
      ? t('assistant.attachments.unavailable')
      : resolution?.isOverLimit
        ? t('assistant.attachments.over_limit')
        : resolution?.isEmpty
          ? t('assistant.attachments.empty')
          : selection.length === 1
            ? selection[0].name
            : t('assistant.attachments.items', {
                smart_count: selection.length
              })

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
          {hasSelection && folderUrl && (
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
          {!hasSelection && (
            <ActionsMenuItem selected onClick={closeMenu}>
              <Typography variant="body1">
                {t('assistant.attachments.all_documents')}
              </Typography>
            </ActionsMenuItem>
          )}
          <ActionsMenuItem onClick={handleChoose}>
            <div className="u-flex u-flex-items-center">
              <Icon icon={Pen} size={16} className="u-mr-half" />
              <Typography variant="body1">
                {t(
                  hasSelection
                    ? 'assistant.attachments.edit'
                    : 'assistant.attachments.choose'
                )}
              </Typography>
            </div>
          </ActionsMenuItem>
          {hasSelection && (
            <ActionsMenuItem onClick={handleReset}>
              <Typography variant="body1">
                {t('assistant.attachments.all_documents')}
              </Typography>
            </ActionsMenuItem>
          )}
        </ActionsMenu>
      )}
      {isPickerOpen && (
        <FolderPickerDialog
          open
          multiple
          onlyFolder={false}
          selectLabel={t('assistant.attachments.select')}
          onClose={() => setIsPickerOpen(false)}
          onSelect={docs => setAttachmentsSelection(conversationId, docs)}
        />
      )}
    </>
  )
}

export default DriveSourceChip
