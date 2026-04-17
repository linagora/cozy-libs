import PropTypes from 'prop-types'
import React, { useReducer, useState } from 'react'

import { useClient } from 'cozy-client'
import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import CopyIcon from 'cozy-ui/transpiled/react/Icons/Copy'
import LinkIcon from 'cozy-ui/transpiled/react/Icons/Link'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import { ShareRestrictionModal } from './ShareRestrictionModal/ShareRestrictionModal'
import {
  copyToClipboard,
  createSharingLink
} from './ShareRestrictionModal/helpers'
import { useSharingContext } from '../hooks/useSharingContext'

const ShareByLink = ({ link, document, documentType }) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const { showAlert } = useAlert()
  const client = useClient()
  const { shareByLink, getOwner, getSharingById } = useSharingContext()
  const [isGenerating, setIsGenerating] = useState(false)

  const canShare = typeof navigator?.share === 'function'
  const showGenerateButton =
    flag('sharing.generate-link-button.enabled') && !link
  const showCopyAndSendButtons = !showGenerateButton && isMobile && canShare
  const showOnlyCopyButton = !showGenerateButton && (!isMobile || !canShare)
  const isFederated = flag('drive.federated-shared-folder.enabled')

  const [isEditDialogOpen, toggleEditDialogOpen] = useReducer(
    state => !state,
    false
  )

  const showGenericError = () => {
    showAlert({
      message: t(`${documentType}.share.error.generic`),
      severity: 'error',
      variant: 'filled'
    })
  }

  const handleGenerateLink = async () => {
    setIsGenerating(true)
    try {
      return await createSharingLink({
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
        editingRights: 'readOnly'
      })
    } catch (_error) {
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  const generateLinkAndCopyLinkToClipboard = async () => {
    let linkToCopy = link
    if (!linkToCopy) {
      linkToCopy = await handleGenerateLink()
    }
    if (linkToCopy) {
      await copyToClipboard(linkToCopy, { t, showAlert })
    } else {
      showGenericError()
    }
  }

  const generateLinkSilently = async () => {
    const generated = await handleGenerateLink()
    if (!generated) {
      showGenericError()
    }
  }

  const shareLink = async () => {
    let linkToShare = link
    if (!linkToShare) {
      linkToShare = await handleGenerateLink()
    }
    if (!linkToShare) {
      showGenericError()
      return
    }

    try {
      const shareData = {
        text: t(`${documentType}.share.shareByLink.shareDescription`, {
          name: document.name || ''
        }),
        url: linkToShare
      }
      await navigator.share(shareData)
    } catch (error) {
      // Don't show error when user cancels the share dialog
      if (error.name !== 'AbortError') {
        showGenericError()
      }
    }
  }

  return (
    <div
      className={
        isFederated ? 'u-w-100' : 'u-w-100 u-flex u-flex-justify-center'
      }
    >
      {showCopyAndSendButtons && (
        <>
          <Button
            label={t(`${documentType}.share.shareByLink.send`)}
            variant="secondary"
            size="medium"
            startIcon={<Icon icon={LinkIcon} />}
            onClick={shareLink}
            busy={isGenerating}
          />
          <Button
            label={<Icon icon={CopyIcon} />}
            variant="secondary"
            size="medium"
            onClick={generateLinkAndCopyLinkToClipboard}
            disabled={isGenerating}
          />
        </>
      )}
      {showOnlyCopyButton && (
        <Button
          label={t(`${documentType}.share.shareByLink.copy`)}
          variant="secondary"
          size="medium"
          startIcon={<Icon icon={LinkIcon} />}
          onClick={generateLinkAndCopyLinkToClipboard}
          busy={isGenerating}
        />
      )}
      {showGenerateButton && (
        <Button
          label={t(`${documentType}.share.shareByLink.create`)}
          variant="secondary"
          size="medium"
          startIcon={<Icon icon={LinkIcon} />}
          onClick={generateLinkSilently}
          busy={isGenerating}
        />
      )}
      {isEditDialogOpen && (
        <ShareRestrictionModal file={document} onClose={toggleEditDialogOpen} />
      )}
    </div>
  )
}

ShareByLink.propTypes = {
  link: PropTypes.string,
  document: PropTypes.object.isRequired,
  documentType: PropTypes.string.isRequired
}

export default ShareByLink
