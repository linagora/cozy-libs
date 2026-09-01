import useI18n from 'components/useI18n'
import React from 'react'

import { Cross, Icon, RestrictedWorkspace } from '@linagora/twake-icons'
import Alert from 'cozy-ui/transpiled/react/Alert'
import Button from 'cozy-ui/transpiled/react/Buttons'
import {
  ConfirmDialog,
  IllustrationDialog
} from 'cozy-ui/transpiled/react/CozyDialogs'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import { PlatformBannersPortal } from './PlatformBannersPortal'
import { useBanners } from './useBanners'

/** Rendered directly: `Icon` paints one theme colour over the whole glyph. */
const RESTRICTED = (
  <RestrictedWorkspace
    width={100}
    height={100}
    className="u-mb-1"
    aria-hidden="true"
  />
)

/**
 * A banner in the application's own layout, above its content. Polite whatever
 * the severity: the condition outlives the page, so an assertive region would
 * re-interrupt on every navigation.
 */
const PlatformBanner = ({ banner, onDismiss }) => {
  const { t } = useI18n()

  const action =
    banner.cta || banner.dismissible ? (
      <>
        {banner.cta && (
          <Button
            variant="text"
            size="small"
            label={banner.cta.label}
            component="a"
            href={banner.cta.url}
          />
        )}
        {banner.dismissible && (
          <IconButton
            size="small"
            aria-label={t('platformBanners.dismiss')}
            onClick={() => onDismiss(banner)}
          >
            <Icon icon={Cross} />
          </IconButton>
        )}
      </>
    ) : null

  return (
    <Alert
      role="status"
      severity={banner.severity}
      data-banner-id={banner.bannerId}
      action={action}
      // The host application may cancel the context menu across its content.
      onContextMenu={event => event.stopPropagation()}
    >
      <span lang={banner.lang} className="coz-platform-banner-text">
        {banner.text}
      </span>
    </Alert>
  )
}

/**
 * A banner that interrupts rather than informs.
 *
 * Always escapable: a dialog with no call to action and no dismiss control
 * would cover the application for good. Wider than the Figma's 480 except on
 * mobile, where that size goes full screen and clips the actions. Named from
 * its text when there is no heading, since cozy-ui's `aria-labelledby` then
 * points at an empty block.
 */
const BlockingDialog = ({ banner, onDismiss }) => {
  const { isMobile } = useBreakpoints()
  const illustration = banner.category === 'billing' ? RESTRICTED : undefined
  const dismissible = banner.dismissible || !banner.cta
  const Dialog = illustration ? IllustrationDialog : ConfirmDialog

  // A stray backdrop click is not the user asking, and a dismissal is recorded
  // server side for every device.
  const onClose = (event, reason) => {
    if (reason !== 'backdropClick') onDismiss(banner)
  }

  return (
    <Dialog
      open
      data-banner-id={banner.bannerId}
      size={isMobile ? 'small' : 'medium'}
      actionsLayout={isMobile ? 'column' : undefined}
      disableEscapeKeyDown={!dismissible}
      onClose={dismissible ? onClose : undefined}
      PaperProps={banner.title ? undefined : { 'aria-label': banner.text }}
      title={
        banner.title || illustration ? (
          <div
            className={
              illustration
                ? 'u-flex u-flex-column u-flex-items-center u-ta-center'
                : undefined
            }
          >
            {illustration}
            <span lang={banner.lang}>{banner.title}</span>
          </div>
        ) : null
      }
      content={
        <Typography lang={banner.lang} className="coz-platform-banner-text">
          {banner.text}
        </Typography>
      }
      actions={
        banner.cta && (
          <>
            {banner.secondaryCta && (
              <Button
                variant="secondary"
                label={banner.secondaryCta.label}
                component="a"
                href={banner.secondaryCta.url}
              />
            )}
            <Button
              label={banner.cta.label}
              component="a"
              href={banner.cta.url}
            />
          </>
        )
      }
    />
  )
}

/**
 * Platform banners, rendered by the bar into the application. Only the inline
 * ones reach the portal; MUI puts the dialog on the body.
 *
 * @returns {import('react').ReactNode} The banners and the blocking dialog
 */
export const PlatformBanners = () => {
  const { banners, dismiss } = useBanners()

  const inline = banners.filter(banner => banner.surface !== 'modal')
  const blocking = banners.find(banner => banner.surface === 'modal')

  return (
    <>
      {inline.length > 0 && (
        <PlatformBannersPortal>
          {inline.map(banner => (
            <PlatformBanner
              key={banner.bannerId}
              banner={banner}
              onDismiss={dismiss}
            />
          ))}
        </PlatformBannersPortal>
      )}
      {blocking && <BlockingDialog banner={blocking} onDismiss={dismiss} />}
    </>
  )
}
