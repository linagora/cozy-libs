import cx from 'classnames'
import React from 'react'

import { useClient } from 'cozy-client'
import MemberList from 'cozy-ui/transpiled/react/MemberList'
import Typography from 'cozy-ui/transpiled/react/Typography'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import ShareDialogTwoStepsConfirmationContainer from './ShareDialogTwoStepsConfirmationContainer'
import { makeMemberRoles, makeMembers } from '../helpers/members'
import { addAvatarUrls } from '../helpers/recipients'

/**
 * Displays the sharing interface that can be used when ConfirmTrustedRecipientsDialog is in sharing state
 */
const SharingContent = ({ recipientsToBeConfirmed, verifyRecipient }) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const client = useClient()
  const members = makeMembers({
    t,
    recipients: addAvatarUrls(
      recipientsToBeConfirmed.map(recipient => ({
        ...recipient,
        index: `key_r_${recipient.id}`
      })),
      client.options.uri
    ),
    recipientsToBeConfirmed,
    isOwner: false,
    verifyRecipient,
    onOpenGroup: () => {}
  })
  const roles = makeMemberRoles(t)

  return (
    <>
      <Typography
        variant="body1"
        className={cx(
          'u-mb-half',
          isMobile ? 'u-ph-1 u-mt-1' : 'u-ph-2 u-mt-1-half'
        )}
      >
        {t(`ConfirmRecipientModal.intruction`)}
      </Typography>
      <MemberList
        className={isMobile ? 'u-mb-half' : 'u-mb-1'}
        members={members}
        roles={roles}
        onRoleChange={() => {}}
        onRemove={() => {}}
        showEmptyState={false}
      />
    </>
  )
}

/**
 * Displays the dialog's title that can be used when ConfirmTrustedRecipientsDialog is in sharing state
 */
const SharingTitle = ({ recipientsToBeConfirmed }) => {
  const { t } = useI18n()

  const title = t(`ConfirmRecipientModal.title`, {
    smart_count: recipientsToBeConfirmed.length
  })

  return title
}

const ConfirmTrustedRecipientsDialog = ({ ...props }) => {
  return (
    <ShareDialogTwoStepsConfirmationContainer
      {...props}
      dialogContentOnShare={SharingContent}
      dialogActionsOnShare={null}
      dialogTitleOnShare={SharingTitle}
    />
  )
}

export default ConfirmTrustedRecipientsDialog
