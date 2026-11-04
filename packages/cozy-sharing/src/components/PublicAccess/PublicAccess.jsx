import PropTypes from 'prop-types'
import React, { useState } from 'react'

import { Icon, Gear, Link, Lock } from '@linagora/twake-icons'
import { useClient } from 'cozy-client'
import Avatar from 'cozy-ui/transpiled/react/Avatar'
import Divider from 'cozy-ui/transpiled/react/Divider'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import PublicAccessMenu from './PublicAccessMenu'
import { checkIsReadOnlyPermissions } from '../../helpers/permissions'
import {
  getPublicAccessStatus,
  isViewerOnlyLink
} from '../../helpers/publicAccess'
import { useSharingContext } from '../../hooks/useSharingContext'
import { ShareRestrictionModal } from '../ShareRestrictionModal/ShareRestrictionModal'
import {
  READ_ONLY_PERMS,
  WRITE_PERMS,
  createSharingLink
} from '../ShareRestrictionModal/helpers'

const getMenuValue = ({ link, permissions }) => {
  if (!link) return 'restricted'
  return checkIsReadOnlyPermissions(permissions) ? 'one-way' : 'two-way'
}

const PublicAccess = ({
  document,
  documentType,
  link,
  permissions,
  isAutoOpenSettings = false,
  onUpdateLinkPermissions,
  onRevokeLink
}) => {
  const { t, f } = useI18n()
  const { isMobile } = useBreakpoints()
  const { showAlert } = useAlert()
  const client = useClient()
  const { shareByLink, getOwner, getSharingById, hasWriteAccess } =
    useSharingContext()
  const [isCreatingLink, setCreatingLink] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)

  const status = getPublicAccessStatus({ link, permissions })
  const statusText = t(`Share.publicAccess.status.${status.key}`, {
    date: status.expiresDate ? f(status.expiresDate, 'PP') : ''
  })
  const menuValue = getMenuValue({ link, permissions })
  const isViewerOnly = isViewerOnlyLink({
    documentType,
    document,
    hasWriteAccess,
    getSharingById
  })

  const handleTypeChange = async type => {
    if (link) {
      const verbs = type === 'two-way' ? WRITE_PERMS : READ_ONLY_PERMS
      onUpdateLinkPermissions(document, { verbs })
      return
    }

    setCreatingLink(true)
    try {
      const createdLink = await createSharingLink({
        client,
        file: document,
        documentType,
        shareByLink,
        getOwner,
        getSharingById,
        t,
        showAlert,
        password: '',
        ttl: undefined,
        editingRights: type === 'two-way' ? 'write' : 'readOnly'
      })
      if (!createdLink) throw new Error('link-creation-failed')
      if (isAutoOpenSettings) setSettingsOpen(true)
    } catch (_error) {
      showAlert({
        message: t(`${documentType}.share.error.generic`),
        severity: 'error',
        variant: 'filled'
      })
    } finally {
      setCreatingLink(false)
    }
  }

  return (
    <div className="u-mt-1">
      <Divider textAlign="center" className="u-ph-2 u-ph-1-s">
        {t('Share.publicAccess.divider')}
      </Divider>
      <div className="u-flex u-flex-items-center u-flex-justify-between u-mt-1 u-ph-2 u-ph-1-s">
        <Typography variant="h6">{t('Share.publicAccess.title')}</Typography>
        <IconButton
          aria-label={t('Share.publicAccess.settings')}
          onClick={() => setSettingsOpen(true)}
        >
          <Icon icon={Gear} />
        </IconButton>
      </div>
      <List className="u-pt-0">
        <ListItem
          gutters={isMobile ? 'default' : 'double'}
          size="small"
          ellipsis={false}
        >
          <ListItemIcon>
            <Avatar size="m" color="none" border innerBorder>
              <Icon icon={link ? Link : Lock} />
            </Avatar>
          </ListItemIcon>
          <ListItemText primary={statusText} />
          <PublicAccessMenu
            value={menuValue}
            isViewerOnly={isViewerOnly}
            isBusy={isCreatingLink}
            onChange={handleTypeChange}
            onDeactivate={() => onRevokeLink(document)}
          />
        </ListItem>
      </List>
      {isSettingsOpen && (
        <ShareRestrictionModal
          file={document}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}

PublicAccess.propTypes = {
  document: PropTypes.object.isRequired,
  documentType: PropTypes.string.isRequired,
  link: PropTypes.string,
  permissions: PropTypes.arrayOf(PropTypes.object),
  isAutoOpenSettings: PropTypes.bool,
  onUpdateLinkPermissions: PropTypes.func.isRequired,
  onRevokeLink: PropTypes.func.isRequired
}

export default PublicAccess
