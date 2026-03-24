import PropTypes from 'prop-types'
import React from 'react'
import snarkdown from 'snarkdown'

import { useClient } from 'cozy-client'
import flag from 'cozy-flags'
import Alert from 'cozy-ui/transpiled/react/Alert'
import Avatar from 'cozy-ui/transpiled/react/Avatar'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import CozyHomeLinkIcon from './CozyHomeLinkIcon'
import styles from '../../../styles/publicBanner.styl'

const getPublicNameFromSharing = sharing =>
  sharing.attributes.members[0].public_name

const PublicBannerCozyToCozyContent = ({ sharing }) => {
  const { t } = useI18n()
  const client = useClient()
  const name = getPublicNameFromSharing(sharing)
  const avatarURL = `${client.options.uri}/public/avatar?fallback=initials`

  const withAvatar = snarkdown(
    t('Share.banner.shared_from', {
      name: name,
      image: avatarURL
    })
  )
  const beginning = withAvatar.split('<img src')
  const [userBoldName, ending] = beginning[1]
    .split('<strong>')[1]
    .split('</strong>')

  return (
    <Avatar className={styles['bannermarkdown']}>
      {beginning[0]}
      <img src={avatarURL} alt="avatar" /> <strong>{userBoldName}</strong>
      {ending}
    </Avatar>
  )
}
PublicBannerCozyToCozyContent.propTypes = {
  sharing: PropTypes.object.isRequired
}

const openExternalLink = url => (window.location = url)

const SharingBannerCozyToCozy = ({
  sharing,
  isSharingShortcutCreated,
  addSharingLink,
  onClose
}) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  const action = () => openExternalLink(addSharingLink)
  const buttonOne = isSharingShortcutCreated
    ? {
        label: t('Share.banner.sync_to_mine', { smart_count: 2 }),
        icon: 'sync-cozy',
        action
      }
    : {
        label: t('Share.banner.add_to_mine', { smart_count: 2 }),
        icon: 'to-the-cloud',
        action
      }
  return (
    <Alert
      color="var(--defaultBackgroundColor)"
      square
      block={isMobile}
      action={
        <>
          <Button
            variant="text"
            label={buttonOne.label}
            icon={buttonOne.icon}
            onClick={buttonOne.action}
          />
          <Button
            variant="text"
            label={t('Share.banner.close')}
            onClick={onClose}
          />
        </>
      }
    >
      <PublicBannerCozyToCozyContent sharing={sharing} />
    </Alert>
  )
}

const SharingBannerByLinkText = () => {
  const { t } = useI18n()
  const text = t('Share.banner.whats_cozy')
  const knowMore = (
    <a
      href="https://twake.app"
      target="_blank"
      className="u-link"
      rel="noopener noreferrer"
    >
      {t('Share.banner.know_more')}
    </a>
  )
  return (
    <span style={{ color: 'var(--iconTextColor)' }}>
      {text} {knowMore}
    </span>
  )
}

const SharingBannerByLink = ({ onClose }) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  const HOME_LINK_HREF = flag('signup.url')
  const canNotCreateTwakeFromPublicSharingLink = flag(
    'drive.twake-creation-from-public-sharing.disabled'
  )

  if (canNotCreateTwakeFromPublicSharingLink) {
    return null
  }

  return (
    <Alert
      color="var(--defaultBackgroundColor)"
      square
      block={isMobile}
      action={
        <>
          <Button
            component="a"
            variant="text"
            label={t('Share.create-cozy', { smart_count: 2 })}
            icon={CozyHomeLinkIcon}
            href={HOME_LINK_HREF}
          />
          <Button
            variant="text"
            label={t('Share.banner.close')}
            onClick={onClose}
          />
        </>
      }
    >
      <SharingBannerByLinkText />
    </Alert>
  )
}
SharingBannerCozyToCozy.propTypes = {
  sharing: PropTypes.object.isRequired,
  isSharingShortcutCreated: PropTypes.bool.isRequired,
  addSharingLink: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
}
export { SharingBannerCozyToCozy, SharingBannerByLink }
