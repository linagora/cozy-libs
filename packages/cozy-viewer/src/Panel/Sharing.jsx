import PropTypes from 'prop-types'
import React from 'react'

import flag from 'cozy-flags'
import {
  useSharingContext,
  MemberRecipientLite,
  OwnerRecipientDefaultLite,
  LinkRecipientLite
} from 'cozy-sharing'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

import { withViewerLocales } from '../hoc/withViewerLocales'
import { useShareModal } from '../providers/ShareModalProvider'

const Sharing = ({ file, t }) => {
  const { setShowShareModal } = useShareModal()
  const {
    isOwner,
    getDocumentPermissions,
    getSharingLink,
    allLoaded,
    getRecipients
  } = useSharingContext()

  const recipients = getRecipients(file._id)
  const permissions = getDocumentPermissions(file._id)
  const link = getSharingLink(file._id)
  const _isOwner = isOwner(file._id)

  const showModal = () => {
    if (!flag('drive.new-file-viewer-ui.enabled')) {
      setShowShareModal(true)
    }
  }

  return (
    <>
      <ListItem
        size="large"
        divider
        button={!flag('drive.new-file-viewer-ui.enabled')}
        onClick={showModal}
      >
        <ListItemText
          primary={
            <>
              {t('Viewer.panel.sharing')}
              {!allLoaded && <Spinner className="u-ml-half" noMargin />}
            </>
          }
          primaryTypographyProps={{ variant: 'h6' }}
        />
        {!flag('drive.new-file-viewer-ui.enabled') && (
          <ListItemIcon>
            <Icon icon={RightIcon} color="var(--secondaryTextColor)" />
          </ListItemIcon>
        )}
      </ListItem>
      <List>
        <LinkRecipientLite permissions={permissions} link={link} />
        {recipients.length > 0 ? (
          recipients.map(recipient => (
            <MemberRecipientLite
              key={recipient.index}
              recipient={recipient}
              isOwner={_isOwner}
            />
          ))
        ) : (
          <OwnerRecipientDefaultLite />
        )}
        {flag('drive.new-file-viewer-ui.enabled') && (
          <ListItem>
            <Button
              variant="secondary"
              label={t('Viewer.panel.manage_access')}
              onClick={() => setShowShareModal(true)}
            />
          </ListItem>
        )}
      </List>
    </>
  )
}

Sharing.propTypes = {
  file: PropTypes.object.isRequired,
  t: PropTypes.func
}

export default withViewerLocales(Sharing)
