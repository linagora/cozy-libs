import cx from 'classnames'
import PropTypes from 'prop-types'
import React, { useEffect, useReducer, useRef, useState } from 'react'

import { Icon, Check, Discuss, EmailOpen, Link } from '@linagora/twake-icons'
import { models, useClient, useQuery, hasQueryBeenLoaded } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import { ShareRestrictionModal } from './ShareRestrictionModal/ShareRestrictionModal'
import {
  copyToClipboard,
  createSharingLink
} from './ShareRestrictionModal/helpers'
import { useSharingContext } from '../hooks/useSharingContext'
import { buildAppsQuery } from '../queries/queries'

const COPIED_DURATION = 2000
const ROUND_BUTTON_CLASSNAME = 'u-miw-auto u-mih-auto u-w-2 u-h-2 u-bdrs-circle'

const findAppUrl = ({ apps, slug }) => {
  const app = models.applications.isInstalled(apps, { slug })
  if (!app) return null
  return models.applications.getUrl(app) ?? null
}

const ShareByLink = ({
  link,
  document,
  documentType,
  isAutoOpenSettings = false
}) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const { showAlert } = useAlert()
  const client = useClient()
  const { shareByLink, getOwner, getSharingById } = useSharingContext()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setCopied] = useState(false)
  const copiedTimeout = useRef(null)

  const appsQuery = buildAppsQuery()
  const appsResult = useQuery(appsQuery.definition, appsQuery.options)
  const apps = hasQueryBeenLoaded(appsResult) ? appsResult.data : []
  const mailUrl = findAppUrl({ apps, slug: 'mail' })
  const chatUrl = findAppUrl({ apps, slug: 'chat' })
  const hasMailApp = mailUrl !== null
  const hasChatApp = chatUrl !== null
  const hasAppButtons = hasMailApp || hasChatApp

  const isSendLinkShown = isMobile && typeof navigator?.share === 'function'

  const [isEditDialogOpen, toggleEditDialogOpen] = useReducer(
    state => !state,
    false
  )

  useEffect(() => () => clearTimeout(copiedTimeout.current), [])

  const showGenericError = () => {
    showAlert({
      message: t(`${documentType}.share.error.generic`),
      severity: 'error',
      variant: 'filled'
    })
  }

  const showCopied = () => {
    clearTimeout(copiedTimeout.current)
    setCopied(true)
    copiedTimeout.current = setTimeout(() => setCopied(false), COPIED_DURATION)
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

  const copyLink = async () => {
    if (link) {
      const isLinkCopied = await copyToClipboard({
        value: link,
        t,
        showAlert,
        isSuccessAlertShown: false
      })
      if (isLinkCopied) showCopied()
      return
    }
    // Safari: the clipboard API must be invoked synchronously within the
    // click handler, so we pass the pending link to `copyToClipboard`.
    // The resolved URL is captured here so we can branch on success after
    // the copy has completed, without re-awaiting the promise.
    let generatedLink = null
    const isLinkCopied = await copyToClipboard({
      value: handleGenerateLink().then(generated => {
        generatedLink = generated
        if (!generated) throw new Error('link-generation-failed')
        return generated
      }),
      t,
      showAlert,
      isSuccessAlertShown: false
    })
    if (!generatedLink) {
      showGenericError()
      return
    }
    if (isLinkCopied) showCopied()
    if (isAutoOpenSettings) {
      toggleEditDialogOpen()
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
      className={cx('u-w-100 u-flex u-flex-items-center', {
        'u-flex-justify-end': !hasAppButtons
      })}
    >
      {isSendLinkShown && (
        <Button
          className="u-mr-half"
          label={t(`${documentType}.share.shareByLink.send`)}
          variant="secondary"
          size="medium"
          startIcon={<Icon icon={Link} />}
          onClick={shareLink}
          disabled={isGenerating}
        />
      )}
      <Button
        label={
          isCopied
            ? t(`${documentType}.share.shareByLink.copiedButton`)
            : t(`${documentType}.share.shareByLink.copy`)
        }
        color={isCopied ? 'success' : undefined}
        size="medium"
        startIcon={<Icon icon={isCopied ? Check : Link} />}
        onClick={copyLink}
        busy={isGenerating}
      />
      {hasAppButtons && (
        <div className="u-ml-auto u-flex u-flex-items-center">
          {hasMailApp && (
            <Button
              component="a"
              href={mailUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('Share.publicAccess.sendByEmail')}
              className={ROUND_BUTTON_CLASSNAME}
              classes={{ label: 'u-flex u-w-auto' }}
              variant="secondary"
              label={<Icon icon={EmailOpen} />}
            />
          )}
          {hasChatApp && (
            <Button
              component="a"
              href={chatUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('Share.publicAccess.sendByChat')}
              className={cx(ROUND_BUTTON_CLASSNAME, {
                'u-ml-half': hasMailApp
              })}
              classes={{ label: 'u-flex u-w-auto' }}
              variant="secondary"
              label={<Icon icon={Discuss} />}
            />
          )}
        </div>
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
  documentType: PropTypes.string.isRequired,
  isAutoOpenSettings: PropTypes.bool
}

export default ShareByLink
