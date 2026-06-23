import { Icon, CloudBroken } from '@linagora/twake-icons'
import React from 'react'

import Button from 'cozy-ui/transpiled/react/deprecated/Button'

import styles from './styles.styl'
import { withViewerLocales } from '../hoc/withViewerLocales'

const NoNetworkViewer = ({ t, onReload }) => (
  <div className={styles['viewer-canceled']}>
    <Icon icon={CloudBroken} width={160} height={140} />
    <h2>{t('Viewer.error.network')}</h2>
    <Button onClick={onReload} label={t('Viewer.retry')} />
  </div>
)

export default withViewerLocales(NoNetworkViewer)
