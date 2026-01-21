import PropTypes from 'prop-types'
import React, { useReducer, useState } from 'react'
import { useI18n } from 'twake-i18n'

import { useClient } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import CopyIcon from 'cozy-ui/transpiled/react/Icons/Copy'
import LinkIcon from 'cozy-ui/transpiled/react/Icons/Link'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

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
  const { shareByLink } = useSharingContext()
  const [isGenerating, setIsGenerating] = useState(false)

  const canShare = typeof navigator?.share === 'function'
  const showCopyAndSendButtons = isMobile && canShare
  const showOnlyCopyButton = !isMobile || !canShare

  const [isEditDialogOpen, toggleEditDialogOpen] = useReducer(
    state => !state,
    false
  )

  const handleGenerateLink = async () => {
    setIsGenerating(true)
    try {
      return await createSharingLink({
        client,
        file: document,
        documentType,
        shareByLink,
        t,
        showAlert,
        password: '',
        ttl: undefined,
        editingRights: 'readOnly'
      })
    } catch (error) {
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
      showAlert({
        message: t(`${documentType}.share.error.generic`),
        severity: 'error',
        variant: 'filled'
      })
    }
  }

  const shareLink = async () => {
    let linkToShare = link
    if (!linkToShare) {
      linkToShare = await handleGenerateLink()
    }
    if (!linkToShare) {
      showAlert({
        message: t(`${documentType}.share.error.generic`),
        severity: 'error',
        variant: 'filled'
      })
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
        showAlert({
          message: t(`${documentType}.share.error.generic`),
          severity: 'error',
          variant: 'filled'
        })
      }
    }
  }

  return (
    <div className="u-w-100 u-flex u-flex-justify-center">
      {showCopyAndSendButtons && (
        <>
          <Button
            label={t(`${documentType}.share.shareByLink.send`)}
            variant="secondary"
            size="medium"
            startIcon={<Icon icon={LinkIcon} />}
            className="u-flex-auto u-mr-half"
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
          className="u-flex-auto u-mr-half"
          onClick={generateLinkAndCopyLinkToClipboard}
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
