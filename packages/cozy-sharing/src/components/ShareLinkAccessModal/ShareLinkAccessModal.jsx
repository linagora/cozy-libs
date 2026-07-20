import { addDays } from 'date-fns'
import PropTypes from 'prop-types'
import React, { useState } from 'react'

import { Icon, Link as LinkIcon, Settings } from '@linagora/twake-icons'
import Alert from 'cozy-ui/transpiled/react/Alert'
import Box from 'cozy-ui/transpiled/react/Box'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Chip from 'cozy-ui/transpiled/react/Chips'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import DatePicker from 'cozy-ui/transpiled/react/DatePicker'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import FormControlLabel from 'cozy-ui/transpiled/react/FormControlLabel'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Menu from 'cozy-ui/transpiled/react/Menu'
import MenuItem from 'cozy-ui/transpiled/react/MenuItem'
import Switch from 'cozy-ui/transpiled/react/Switch'
import TextField from 'cozy-ui/transpiled/react/TextField'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import withLocales from '../../hoc/withLocales'
import { useSharingContext } from '../../hooks/useSharingContext'

const DIALOG_CLASSES = { paper: 'u-h-auto' }
const PASSWORD_MIN_LENGTH = 4

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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const isPasswordValid =
    !passwordEnabled || password.trim().length >= PASSWORD_MIN_LENGTH
  const handleAccessMenuClose = () => {
    setAccessAnchorEl(null)
  }

  const handleDateEnabledChange = event => {
    setDateEnabled(event.target.checked)
    setSelectedDate(event.target.checked ? addDays(new Date(), 30) : null)
  }

  const handlePasswordEnabledChange = event => {
    setPasswordEnabled(event.target.checked)
  }

  const handlePasswordChange = event => {
    setPassword(event.target.value)
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
      const results = []
      for (const document of documents) {
        const result = await ensureSharingLink(document, {
          editingRights,
          dateEnabled,
          selectedDate,
          passwordEnabled,
          password: password.trim()
        })
        results.push(result)
      }
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
        onBack={busy ? undefined : handleSettingsBack}
        onClose={busy ? undefined : handleSettingsBack}
        title={t('ShareLinkAccessModal.settingsTitle')}
        content={
          <Box display="flex" flexDirection="column" gridGap="1rem">
            <FormControlLabel
              control={
                <Switch
                  checked={dateEnabled}
                  onChange={handleDateEnabledChange}
                  disabled={busy}
                  color="primary"
                />
              }
              label={t('ShareLinkAccessModal.expiry')}
            />
            {dateEnabled && (
              <DatePicker
                label={t('ShareLinkAccessModal.expiryDate')}
                value={selectedDate}
                minDate={new Date()}
                onChange={setSelectedDate}
                disabled={busy}
                className="u-w-100"
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={passwordEnabled}
                  onChange={handlePasswordEnabledChange}
                  disabled={busy}
                  color="primary"
                />
              }
              label={t('ShareLinkAccessModal.password')}
            />
            {passwordEnabled && (
              <TextField
                label={t('ShareLinkAccessModal.passwordLabel')}
                value={password}
                onChange={handlePasswordChange}
                disabled={busy}
                type="password"
                error={!isPasswordValid}
                helperText={
                  isPasswordValid
                    ? null
                    : t('ShareLinkAccessModal.passwordTooShort')
                }
                fullWidth
                inputProps={{ minLength: PASSWORD_MIN_LENGTH }}
              />
            )}
          </Box>
        }
      />
    )
  }

  return (
    <ConfirmDialog
      open
      classes={DIALOG_CLASSES}
      size="medium"
      onBack={busy ? undefined : onCancel}
      onClose={busy ? undefined : onCancel}
      title={t('ShareLinkAccessModal.title')}
      content={
        <Box display="flex" flexDirection="column" gridGap="1rem">
          <Typography>{t('ShareLinkAccessModal.introText')}</Typography>
          <Box display="flex" flexWrap="wrap" gridGap="0.5rem">
            {documents.map(document => (
              <Chip
                key={document._id || document.id}
                avatar={renderDocumentIcon(document)}
                label={document.name}
                size="small"
              />
            ))}
          </Box>
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
            disabled={busy || !isPasswordValid}
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
