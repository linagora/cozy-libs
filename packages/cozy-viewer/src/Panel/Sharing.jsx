import PropTypes from 'prop-types'
import React from 'react'

import { useClient, useQuery } from 'cozy-client'
import flag from 'cozy-flags'
import {
  getRecipientsFromSharing,
  LinkRecipientLite,
  MemberRecipientLite,
  OwnerRecipientDefaultLite,
  useSharingContext
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
import { buildFolderByPathQuery } from '../queries'

const Sharing = ({ file, t }) => {
  const client = useClient()
  const { setShowShareModal } = useShareModal()
  const {
    getDocumentPermissions,
    getSharingById,
    getSharingLink,
    allLoaded,
    getRecipients,
    getSharedParentPath,
    hasSharedParent,
    isOwner
  } = useSharingContext()

  const sharedDriveSharing = file.driveId ? getSharingById(file.driveId) : null
  const sharedParentPath =
    !sharedDriveSharing && file.path && hasSharedParent(file.path)
      ? getSharedParentPath(file.path)
      : null
  const sharedParentQuery = buildFolderByPathQuery(sharedParentPath)
  const { data: sharedParentFolders, fetchStatus: sharedParentFetchStatus } =
    useQuery(sharedParentQuery.definition, {
      ...sharedParentQuery.options,
      enabled: !!sharedParentPath
    })
  const sharingReferenceId =
    !sharedDriveSharing && sharedParentPath && sharedParentFolders?.[0]?._id
      ? sharedParentFolders[0]._id
      : file._id

  if (sharedParentPath && sharedParentFetchStatus !== 'loaded') return null

  const recipients = sharedDriveSharing
    ? getRecipientsFromSharing(sharedDriveSharing, file._id)
    : getRecipients(sharingReferenceId)
  const permissions = getDocumentPermissions(sharingReferenceId)
  const link = getSharingLink(sharingReferenceId)
  const owner = recipients.find(recipient => recipient.status === 'owner')
  const isCurrentUserOwner = file.driveId
    ? owner?.instance === client.options.uri
    : isOwner(sharingReferenceId)

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
              isOwner={isCurrentUserOwner}
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
