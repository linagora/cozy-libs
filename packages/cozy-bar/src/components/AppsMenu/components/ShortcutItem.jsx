import React from 'react'

import { useClient, useFetchShortcut } from 'cozy-client'
import { splitFilename, getShortcutImgSrc } from 'cozy-client/dist/models/file'

import { makeStyles } from 'cozy-ui/transpiled/react/styles'
import Buttons from 'cozy-ui/transpiled/react/Buttons'
import Typography from 'cozy-ui/transpiled/react/Typography'
import cx from 'classnames'

import styles from 'styles/apps-menu.styl'

const useStyles = makeStyles(() => {
  return {
    text: {
      lineHeight: '22.5px',
      fontSize: '12px',
      fontWeight: 400
    }
  }
})

export const ShortcutItem = ({ shortcut }) => {
  const client = useClient()
  const classes = useStyles()
  const { shortcutInfos, shortcutImg } = useFetchShortcut(client, shortcut._id)

  const { filename } = splitFilename(shortcut)
  const url = shortcutInfos?.data?.url || '#'

  const shortcutImgSrc = getShortcutImgSrc(shortcut)

  return (
    <Buttons
      height="auto"
      component="a"
      target="_blank"
      variant="text"
      href={url}
      title={filename}
      className={cx(styles['apps-menu-grid-item-wrapper'], 'u-bdrs-5')}
      label={
        <div className={styles['apps-menu-grid-item']}>
          <div className={styles['apps-menu-grid-item-icon']}>
            {shortcutImgSrc ? (
              <img className="u-bdrs-5 u-w-100" src={shortcutImgSrc} alt="" />
            ) : (
              <img className="u-bdrs-5 u-w-100" src={shortcutImg} alt="" />
            )}
          </div>
          <Typography
            noWrap
            align="center"
            className={`u-w-100 ${classes.text}`}
          >
            {filename}
          </Typography>
        </div>
      }
    />
  )
}

export default ShortcutItem
