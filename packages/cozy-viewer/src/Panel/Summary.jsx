import cx from 'classnames'
import PropTypes from 'prop-types'
import React, { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import flag from 'cozy-flags'
import Accordion from 'cozy-ui/transpiled/react/Accordion'
import AccordionDetails from 'cozy-ui/transpiled/react/AccordionDetails'
import AccordionSummary from 'cozy-ui/transpiled/react/AccordionSummary'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import {
  makeActions,
  editAttribute,
  copyToClipboard,
  divider,
  exportToText
} from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import ActionsMenuMobileHeader from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuMobileHeader'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import BottomIcon from 'cozy-ui/transpiled/react/Icons/Bottom'
import DotsIcon from 'cozy-ui/transpiled/react/Icons/Dots'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import TextIcon from 'cozy-ui/transpiled/react/Icons/Text'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/ListItemSecondaryAction'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'

import QualificationListItemText from './Qualifications/QualificationListItemText'
import SummaryDialog from './SummaryDialog'
import styles from './styles.styl'
import { makeSummaryLonger, makeSummaryShorter } from '../actions'
import { withViewerLocales } from '../hoc/withViewerLocales'

const Summary = ({ file, isReadOnly, t }) => {
  const [showModal, setShowModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const anchorRef = useRef()
  const { showAlert } = useAlert()
  const location = useLocation()
  const navigate = useNavigate()

  const label = t('Viewer.panel.summary')
  const value = file.metadata?.description
  const actions = makeActions(
    [
      copyToClipboard,
      !isReadOnly && editAttribute,
      flag('drive.new-file-viewer-ui.enabled') && divider,
      flag('drive.new-file-viewer-ui.enabled') && exportToText,
      flag('drive.new-file-viewer-ui.enabled') && divider,
      flag('drive.new-file-viewer-ui.enabled') && makeSummaryShorter,
      flag('drive.new-file-viewer-ui.enabled') && makeSummaryLonger
    ],
    {
      t,
      exportedText: value,
      file,
      location,
      navigate
    }
  )

  const handleClick = async () => {
    if (isReadOnly) return

    if (value) {
      await copyToClipboard().action(undefined, { showAlert, copyValue: value })
    } else {
      setShowModal(true)
    }
  }

  return (
    <List>
      {flag('drive.new-file-viewer-ui.enabled') ? (
        <ListItem>
          <Accordion
            elevation={0}
            className={cx('u-mb-0 u-bdw-0 u-w-100', styles.Summary)}
            expanded={isExpanded}
          >
            <AccordionSummary
              className={cx('u-bg-transparent u-m-0', styles['Summary-Header'])}
              expandIcon={null}
            >
              <Typography variant="caption" className="u-mb-0">
                {label}
              </Typography>
              {value ? (
                <ListItemSecondaryAction>
                  <IconButton
                    aria-label={t('Viewer.panel.more_menu')}
                    size="small"
                    ref={anchorRef}
                    onClick={() => setShowMenu(v => !v)}
                  >
                    <Icon icon={DotsIcon} />
                  </IconButton>
                  <IconButton
                    aria-label={t('Viewer.panel.collapse')}
                    size="small"
                    onClick={() => setIsExpanded(v => !v)}
                  >
                    <Icon icon={BottomIcon} rotate={isExpanded ? 180 : 0} />
                  </IconButton>
                </ListItemSecondaryAction>
              ) : (
                !isReadOnly && (
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => setShowModal(true)}>
                      <Icon
                        icon={RightIcon}
                        color="var(--secondaryTextColor)"
                      />
                    </IconButton>
                  </ListItemSecondaryAction>
                )
              )}
            </AccordionSummary>
            <AccordionDetails>
              <QualificationListItemText
                className="u-pv-1"
                style={{ wordBreak: 'break-word' }}
                secondary={value || label}
                disabled={!value}
                onClick={handleClick}
              />
            </AccordionDetails>
          </Accordion>
        </ListItem>
      ) : (
        <ListItem button={!isReadOnly} onClick={handleClick}>
          <ListItemIcon>
            <Icon icon={TextIcon} />
          </ListItemIcon>
          <QualificationListItemText
            style={{ wordBreak: 'break-word' }}
            primary={value ? label : undefined}
            secondary={value || label}
            disabled={!value}
          />
          {value ? (
            <ListItemSecondaryAction>
              <IconButton ref={anchorRef} onClick={() => setShowMenu(v => !v)}>
                <Icon icon={DotsIcon} />
              </IconButton>
            </ListItemSecondaryAction>
          ) : (
            !isReadOnly && (
              <ListItemIcon>
                <Icon icon={RightIcon} color="var(--secondaryTextColor)" />
              </ListItemIcon>
            )
          )}
        </ListItem>
      )}
      {showModal && (
        <SummaryDialog file={file} onClose={() => setShowModal(false)} />
      )}
      {showMenu && (
        <ActionsMenu
          ref={anchorRef}
          open={true}
          docs={[file]}
          actions={actions}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          autoClose
          componentsProps={{
            actionsItems: {
              actionOptions: {
                showAlert,
                copyValue: value,
                editAttributeCallback: () => setShowModal(true)
              }
            }
          }}
          onClose={() => setShowMenu(false)}
        >
          <ActionsMenuMobileHeader>
            <ListItemText
              primary={label}
              primaryTypographyProps={{ align: 'center', variant: 'h6' }}
            />
          </ActionsMenuMobileHeader>
        </ActionsMenu>
      )}
    </List>
  )
}

Summary.propTypes = {
  file: PropTypes.object.isRequired,
  t: PropTypes.func
}

export default withViewerLocales(Summary)
