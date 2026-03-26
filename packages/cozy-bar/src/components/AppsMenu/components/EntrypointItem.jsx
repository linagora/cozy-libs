import cx from 'classnames'
import useI18n from 'components/useI18n'
import React from 'react'
import styles from 'styles/apps-menu.styl'

import { useClient, generateWebLink } from 'cozy-client'
import Buttons from 'cozy-ui/transpiled/react/Buttons'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { makeStyles } from 'cozy-ui/transpiled/react/styles'

const useStyles = makeStyles(() => {
  return {
    text: {
      lineHeight: '22.5px',
      fontSize: '12px',
      fontWeight: 400
    }
  }
})

export const EntrypointItem = ({ entrypoint }) => {
  const client = useClient()
  const classes = useStyles()
  const { lang } = useI18n()

  const cozyUrl = client.getStackClient().uri
  const { subdomain: subDomainType } = client.getInstanceOptions()

  const entrypointUrl = generateWebLink({
    cozyUrl,
    subDomainType,
    slug: entrypoint.slug,
    pathname: '/',
    hash: entrypoint.hash
  })

  const title = entrypoint.title[lang] || entrypoint.title['en']

  return (
    <Buttons
      height="auto"
      component="a"
      target="_blank"
      rel="noopener noreferrer"
      variant="text"
      href={entrypointUrl}
      title={title}
      className={cx(styles['apps-menu-grid-item-wrapper'], 'u-bdrs-5')}
      label={
        <div className={styles['apps-menu-grid-item']}>
          <div className={styles['apps-menu-grid-item-icon']}>
            <img
              className="u-bdrs-5 u-w-100"
              src={`data:image/svg+xml;base64,${entrypoint.icon}`}
              alt=""
            />
          </div>
          <Typography
            noWrap
            align="center"
            className={`u-w-100  ${classes.text}`}
          >
            {title}
          </Typography>
        </div>
      }
    />
  )
}

export default EntrypointItem
