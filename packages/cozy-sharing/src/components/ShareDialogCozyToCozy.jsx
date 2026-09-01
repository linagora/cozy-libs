import PropTypes from 'prop-types'
import React, { useCallback, useMemo, useState } from 'react'

import { useClient } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { default as DumbShareByLink } from './ShareByLink'
import ShareDialogTwoStepsConfirmationContainer from './ShareDialogTwoStepsConfirmationContainer'
import { ShareRecipientsLimitModal } from './ShareRecipientsLimitModal'
import SharingContent from './SharingContent'
import { getOrCreateFromArray } from '../helpers/contacts'
import { hasReachRecipientsLimit } from '../helpers/recipients'
import { getErrorMessage, getSuccessMessage } from '../helpers/share'
import { usePendingRecipients } from '../hooks/usePendingRecipients'
import { useSharingContext } from '../hooks/useSharingContext'

const SharingTitleFunction = ({ documentType, document }) =>
  function SharingTitle() {
    const { t } = useI18n()
    const title = t(`${documentType}.share.title`, {
      name: document.name || document.attributes?.name
    })
    return title
  }

const ShareDialogCozyToCozy = ({
  showShareByLink,
  showGenerateLinkButton,
  autoOpenShareRestriction,
  documentType,
  document,
  onShare,
  recipients,
  sharingDesc,
  createContact,
  onClose,
  ...props
}) => {
  const { t } = useI18n()
  const client = useClient()
  const { showAlert } = useAlert()
  const { getSharingLink } = useSharingContext()

  const {
    pendingRecipients,
    setPendingRecipients,
    selectedOption,
    setSelectedOption
  } = usePendingRecipients()

  const [submitting, setSubmitting] = useState(false)
  const [showRecipientsLimit, setShowRecipientsLimit] = useState(false)
  const displayedLink = getSharingLink(document._id || document.id)

  const handleShare = useCallback(async () => {
    if (pendingRecipients.length === 0) {
      onClose()
      return
    }

    if (hasReachRecipientsLimit(recipients, pendingRecipients)) {
      setShowRecipientsLimit(true)
      return
    }

    setSubmitting(true)
    try {
      const contacts = await getOrCreateFromArray(
        client,
        pendingRecipients,
        createContact
      )
      const readWriteRecipients = selectedOption === 'readOnly' ? [] : contacts
      const readOnlyRecipients = selectedOption === 'readOnly' ? contacts : []

      await onShare({
        document,
        recipients: readWriteRecipients,
        readOnlyRecipients,
        description: sharingDesc,
        openSharing: readWriteRecipients.length > 0
      })

      showAlert({
        message: t(...getSuccessMessage(recipients, contacts, documentType)),
        severity: 'success',
        variant: 'filled'
      })
      onClose()
    } catch (err) {
      showAlert({
        message: t(
          ...getErrorMessage({
            t,
            err,
            documentType,
            recipients: pendingRecipients,
            selectedOption
          })
        ),
        severity: 'error',
        variant: 'filled'
      })
    } finally {
      setSubmitting(false)
    }
  }, [
    pendingRecipients,
    selectedOption,
    client,
    showAlert,
    t,
    recipients,
    onShare,
    onClose,
    createContact,
    document,
    documentType,
    sharingDesc
  ])

  const dialogActionsOnShare = useMemo(() => {
    const Actions = dialogActionProps => (
      <>
        {showShareByLink && (
          <DumbShareByLink
            {...dialogActionProps}
            showGenerateLinkButton={showGenerateLinkButton}
            autoOpenShareRestriction={autoOpenShareRestriction}
          />
        )}
        <Button
          variant="primary"
          label={t(`${documentType}.share.shareByEmail.send`)}
          busy={submitting}
          onClick={handleShare}
        />
      </>
    )
    Actions.displayName = 'ShareDialogCozyToCozyActions'
    return Actions
  }, [
    handleShare,
    submitting,
    t,
    documentType,
    showShareByLink,
    showGenerateLinkButton,
    autoOpenShareRestriction
  ])

  return (
    <>
      <ShareDialogTwoStepsConfirmationContainer
        {...props}
        link={displayedLink}
        documentType={documentType}
        document={document}
        recipients={recipients}
        sharingDesc={sharingDesc}
        createContact={createContact}
        onShare={onShare}
        onClose={onClose}
        dialogContentOnShare={SharingContent}
        dialogActionsOnShare={dialogActionsOnShare}
        dialogTitleOnShare={SharingTitleFunction({ documentType, document })}
        disableGutters
        pendingRecipients={pendingRecipients}
        onPendingRecipientsChange={setPendingRecipients}
        selectedOption={selectedOption}
        onSelectedOptionChange={setSelectedOption}
      />
      {showRecipientsLimit && (
        <ShareRecipientsLimitModal
          documentName={document?.name}
          onConfirm={() => setShowRecipientsLimit(false)}
        />
      )}
    </>
  )
}

ShareDialogCozyToCozy.propTypes = {
  showShareByLink: PropTypes.bool,
  showGenerateLinkButton: PropTypes.bool,
  autoOpenShareRestriction: PropTypes.bool,
  documentType: PropTypes.string.isRequired,
  document: PropTypes.object.isRequired,
  onShare: PropTypes.func.isRequired,
  recipients: PropTypes.array.isRequired,
  sharingDesc: PropTypes.string,
  createContact: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}

export default ShareDialogCozyToCozy
