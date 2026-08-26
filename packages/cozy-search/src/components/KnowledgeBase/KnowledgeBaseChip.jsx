import { Icon, Dropdown, LinkOut, Pen } from '@linagora/twake-icons'
import cx from 'classnames'
import React, { useRef, useState } from 'react'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

/**
 * Composer chip showing the selected assistant's knowledge-base folder,
 * rendered in the "selected source" style (like the email source chip).
 *
 * Clicking stays in-app: it opens a small menu with explicit actions —
 * open the folder (new tab, at `folderUrl`) or change the knowledge base,
 * which delegates to `onChangeFolder` so the backend adapter owns the picker.
 *
 * Presentational: `folderUrl` and `icon` are resolved by the caller, so this
 * component is backend-agnostic.
 */
const KnowledgeBaseChip = ({
  icon,
  folderName,
  folderUrl,
  isUnavailable,
  isLast,
  onChangeFolder
}) => {
  const { t } = useI18n()
  const chipRef = useRef(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)

  const handleChangeFolder = () => {
    closeMenu()
    onChangeFolder?.()
  }

  const label = isUnavailable
    ? t('assistant.knowledge_base.unavailable')
    : (folderName ?? '…')

  return (
    <>
      <div ref={chipRef} className={cx({ 'u-mr-half': !isLast })}>
        <Chip
          icon={
            <img
              alt=""
              aria-hidden="true"
              src={icon}
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
    </>
  )
}

export default KnowledgeBaseChip
