import cx from 'classnames'
import useI18n from 'components/useI18n'
import React from 'react'
import styles from 'styles/user-menu.styl'

import { useClient } from 'cozy-client'
import { makeDiskInfos } from 'cozy-client/dist/models/instance'
import flag from 'cozy-flags'
import { useWebviewIntent } from 'cozy-intent'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Icon from 'cozy-ui/transpiled/react/Icon'
import CloudRainbowIcon from 'cozy-ui/transpiled/react/Icons/CloudRainbow'
import CompanyIcon from 'cozy-ui/transpiled/react/Icons/Company'
import FromUserIcon from 'cozy-ui/transpiled/react/Icons/FromUser'
import LogoutIcon from 'cozy-ui/transpiled/react/Icons/Logout'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import AvatarMyself from './components/AvatarMyself'
import { getSettingsLink, logOut } from './helpers'

const UserMenuContent = ({
  onLogOut,
  instance,
  diskUsage,
  isSettingsAppInstalled,
  closeMenu
}) => {
  const webviewIntent = useWebviewIntent()

  const client = useClient()
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  const {
    data: { public_name, email }
  } = instance

  const { humanDiskQuota, humanDiskUsage } = makeDiskInfos(
    diskUsage.data.used,
    diskUsage.data.quota
  )

  const profileLink = getSettingsLink({ client, hash: 'menu' })
  const storageLink = getSettingsLink({ client, hash: 'storage' })

  const gutters = isMobile ? 'disabled' : undefined

  return (
    <div className={cx(styles['user-menu-content'], 'u-flex u-flex-column')}>
      <div className="u-flex u-flex-column u-flex-items-center u-mt-half">
        <AvatarMyself className="u-mb-half" />
        <Typography variant="h4">{public_name}</Typography>
        <Typography variant="body2">{email}</Typography>
      </div>
      <List className="u-pb-0">
        {isSettingsAppInstalled && (
          <ListItem
            button
            gutters={gutters}
            size="small"
            component="a"
            href={profileLink}
            onClick={closeMenu}
          >
            <ListItemIcon>
              <Icon icon={FromUserIcon} />
            </ListItemIcon>
            <ListItemText primary={t('userMenu.manageProfile')} />
          </ListItem>
        )}
        {flag('cozy.b2b.enabled') && (
          <ListItem
            button
            gutters={gutters}
            size="small"
            component="a"
            href={flag('cozy.b2b.createBusinessAccountUrl')}
            onClick={closeMenu}
          >
            <ListItemIcon>
              <Icon icon={CompanyIcon} />
            </ListItemIcon>
            <ListItemText primary={t('userMenu.createBusinessAccount')} />
          </ListItem>
        )}
        {isSettingsAppInstalled && (
          <ListItem
            button
            gutters={gutters}
            size="small"
            component="a"
            href={storageLink}
            onClick={closeMenu}
          >
            <ListItemIcon>
              <Icon icon={CloudRainbowIcon} />
            </ListItemIcon>
            <ListItemText
              primary={t('userMenu.storage')}
              secondary={t(
                'userMenu.storageAvailable',
                humanDiskQuota - humanDiskUsage
              )}
            />
            <ListItemIcon>
              <Icon icon={RightIcon} />
            </ListItemIcon>
          </ListItem>
        )}

        <Divider component="li" variant="inset" />

        <ListItem
          button
          gutters={gutters}
          size="small"
          onClick={() => logOut({ client, webviewIntent, onLogOut })}
        >
          <ListItemIcon>
            <Icon icon={LogoutIcon} />
          </ListItemIcon>
          <ListItemText primary={t('userMenu.logOut')} />
        </ListItem>
      </List>
    </div>
  )
}

export default UserMenuContent
