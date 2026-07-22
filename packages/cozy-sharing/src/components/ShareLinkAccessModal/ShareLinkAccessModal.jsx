import PropTypes from 'prop-types'
import React, { useState } from 'react'

import { Icon, Link as LinkIcon, Settings } from '@linagora/twake-icons'
import Alert from 'cozy-ui/transpiled/react/Alert'
import Box from 'cozy-ui/transpiled/react/Box'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Chip from 'cozy-ui/transpiled/react/Chips'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import Grid from 'cozy-ui/transpiled/react/Grid'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Menu from 'cozy-ui/transpiled/react/Menu'
import MenuItem from 'cozy-ui/transpiled/react/MenuItem'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import withLocales from '../../hoc/withLocales'
import { useSharingContext } from '../../hooks/useSharingContext'
import { ShareLinkSettings } from '../ShareRestrictionModal/ShareLinkSettings'

const DIALOG_CLASSES = { paper: 'u-h-auto' }
const DOCUMENT_ICON_SIZE = 18
export const ShareLinkAccessModal = ({
  documents,
  onCancel,
  onSuccess,
  renderDocumentIcon
}) => {
  const { t } = useI18n()
  const { ensureSharingLink } = useSharingContext()
  const [editingRights, setEditingRights] = useState('readOnly')
  const [accessAnchorEl, setAccessAnchorEl] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [dateEnabled, setDateEnabled] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [passwordEnabled, setPasswordEnabled] = useState(false)
  const [password, setPassword] = useState('')
  const [isDateValid, setIsDateValid] = useState(true)
  const [isPasswordValid, setIsPasswordValid] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const handleAccessMenuClose = () => {
    setAccessAnchorEl(null)
  }

  const handleSettingsOpen = () => {
    setIsSettingsOpen(true)
  }

  const handleSettingsBack = () => {
    setIsSettingsOpen(false)
  }

  const handleSubmit = async () => {
    setBusy(true)
    setError(null)

    try {
      const results = await Promise.all(
        documents.map(document =>
          ensureSharingLink(document, {
            editingRights,
            dateEnabled,
            selectedDate,
            passwordEnabled,
            password: password.trim()
          })
        )
      )
      onSuccess(results)
    } catch {
      setError(t('ShareLinkAccessModal.error.persistence'))
      setBusy(false)
    }
  }

  if (isSettingsOpen) {
    return (
      <ConfirmDialog
        open
        classes={DIALOG_CLASSES}
        size="small"
        onBack={busy ? undefined : handleSettingsBack}
        onClose={busy ? undefined : handleSettingsBack}
        title={t('ShareLinkAccessModal.settingsTitle')}
        content={
          <Box display="flex" flexDirection="column" gridGap="1rem">
            <ShareLinkSettings
              dateEnabled={dateEnabled}
              isPasswordValid={isPasswordValid}
              password={password}
              passwordEnabled={passwordEnabled}
              selectedDate={selectedDate}
              setDateEnabled={setDateEnabled}
              setIsDateValid={setIsDateValid}
              setIsPasswordValid={setIsPasswordValid}
              setPassword={setPassword}
              setPasswordEnabled={setPasswordEnabled}
              setSelectedDate={setSelectedDate}
            />
          </Box>
        }
        actions={
          <Button
            label={t('ShareRestrictionModal.action.confirm')}
            onClick={handleSettingsBack}
            disabled={!isDateValid || !isPasswordValid}
          />
        }
      />
    )
  }

  return (
    <ConfirmDialog
      open
      classes={DIALOG_CLASSES}
      size="small"
      onBack={busy ? undefined : onCancel}
      onClose={busy ? undefined : onCancel}
      title={t('ShareLinkAccessModal.title')}
      content={
        <Box display="flex" flexDirection="column" gridGap="1rem">
          <Typography>{t('ShareLinkAccessModal.introText')}</Typography>
          <Grid container spacing={1}>
            {documents.map(document => (
              <Grid item key={document._id || document.id} xs={12} sm={6}>
                <Chip
                  avatar={
                    <Box component="span" className="u-flex u-ov-hidden">
                      {renderDocumentIcon(document, DOCUMENT_ICON_SIZE)}
                    </Box>
                  }
                  className="u-maw-100"
                  label={document.name}
                  size="small"
                />
              </Grid>
            ))}
          </Grid>
          {error && <Alert severity="error">{error}</Alert>}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gridGap="0.5rem">
              <Icon icon={LinkIcon} />
              <Typography>
                {t('ShareLinkAccessModal.anyoneWithLink')}
              </Typography>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              gridGap="0.5rem"
              className="u-flex-shrink-0"
            >
              <IconButton
                aria-label={t('ShareLinkAccessModal.settings')}
                disabled={busy}
                onClick={handleSettingsOpen}
              >
                <Icon icon={Settings} />
              </IconButton>
              <DropdownButton
                aria-label={t('ShareLinkAccessModal.accessLevel')}
                aria-controls="share-link-access-menu"
                aria-haspopup="true"
                disabled={busy}
                onClick={event => setAccessAnchorEl(event.currentTarget)}
                spaceBetween
                textVariant="body1"
              >
                {t(
                  editingRights === 'readOnly'
                    ? 'ShareLinkAccessModal.viewer'
                    : 'ShareLinkAccessModal.editor'
                )}
              </DropdownButton>
              <Menu
                id="share-link-access-menu"
                anchorEl={accessAnchorEl}
                open={Boolean(accessAnchorEl)}
                onClose={handleAccessMenuClose}
              >
                <MenuItem
                  selected={editingRights === 'readOnly'}
                  onClick={() => {
                    setEditingRights('readOnly')
                    handleAccessMenuClose()
                  }}
                >
                  {t('ShareLinkAccessModal.viewer')}
                </MenuItem>
                <MenuItem
                  selected={editingRights === 'write'}
                  onClick={() => {
                    setEditingRights('write')
                    handleAccessMenuClose()
                  }}
                >
                  {t('ShareLinkAccessModal.editor')}
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Box>
      }
      actions={
        <>
          <Button
            label={t('ShareLinkAccessModal.cancel')}
            variant="secondary"
            onClick={onCancel}
            disabled={busy}
          />
          <Button
            label={t('ShareLinkAccessModal.addLinks')}
            onClick={handleSubmit}
            disabled={busy || !isDateValid || !isPasswordValid}
            busy={busy}
          />
        </>
      }
    />
  )
}

ShareLinkAccessModal.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  renderDocumentIcon: PropTypes.func
}

ShareLinkAccessModal.defaultProps = {
  renderDocumentIcon: () => null
}

export default withLocales(ShareLinkAccessModal)
