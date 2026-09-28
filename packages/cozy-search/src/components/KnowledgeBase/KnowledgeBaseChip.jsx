import React, { useRef, useState } from 'react'

import { Drive, Icon, LinkOut, Pen } from '@linagora/twake-icons'
import { useClient, generateWebLink } from 'cozy-client'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Tooltip from 'cozy-ui/transpiled/react/Tooltip'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import FolderPickerDialog from './FolderPickerDialog'
import styles from './styles.styl'
import SourceButton, { CHIP_CLASSES } from '../TwakeKnowledges/SourceButton'
import sourceStyles from '../TwakeKnowledges/styles.styl'

/**
 * The Drive source of the composer when the selected assistant has a
 * knowledge-base folder: a chip named after the folder (`variant="chip"`,
 * desktop) or an icon button (`variant="icon"`, mobile).
 *
 * Clicking stays in-app: it opens a small menu with explicit actions —
 * open the folder in Drive (new tab) or change the knowledge base through
 * the Drive folder picker (persisted on the assistant immediately). The
 * menu starts with the folder name, which the icon button does not show.
 */
const KnowledgeBaseChip = ({
  dirId,
  folder,
  isRoot,
  isUnavailable,
  onChangeFolder,
  variant = 'chip'
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
    hash: `/folder/${dirId}`
  })

  const label = isUnavailable
    ? t('assistant.knowledge_base.unavailable')
    : isRoot
      ? t('assistant.twake_knowledges.drive')
      : (folder?.name ?? '…')

  return (
    <>
      {variant === 'icon' ? (
        <SourceButton
          ref={chipRef}
          icon={Drive}
          preserveColor
          label={label}
          isActive={!isUnavailable}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(true)}
        />
      ) : (
        // Hovering the chip tells what the folder is for (the design's
        // tooltip); nothing to tell when the folder is gone
        <Tooltip
          title={isUnavailable ? '' : t('assistant.knowledge_base.folder_hint')}
          placement="top"
          classes={{
            tooltip: styles['folder-tooltip'],
            arrow: styles['folder-tooltip-arrow']
          }}
        >
          <div ref={chipRef}>
            <Chip
              icon={<Icon icon={Drive} size={16} preserveColor />}
              label={label}
              clickable
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(true)}
              className={sourceStyles['source-chip']}
              classes={CHIP_CLASSES}
            />
          </div>
        </Tooltip>
      )}
      {isMenuOpen && (
        <ActionsMenu
          open
          ref={chipRef}
          onClose={closeMenu}
          actions={[]}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          {variant === 'icon' && (
            <Typography
              variant="body2"
              className="u-ph-1 u-pb-half u-ellipsis"
              component="div"
            >
              {label}
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
