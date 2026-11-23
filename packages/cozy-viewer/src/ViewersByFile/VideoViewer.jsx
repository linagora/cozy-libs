import React, { useState } from 'react'

import NoViewer from '../NoViewer'
import withFileUrl from '../hoc/withFileUrl'
import { withViewerLocales } from '../hoc/withViewerLocales'
import styles from './styles.styl'

const VideoViewer = ({ t, file, url, renderFallbackExtraContent }) => {
  const [isUnplayable, setIsUnplayable] = useState(false)

  if (isUnplayable) {
    return (
      <NoViewer
        file={file}
        url={url}
        message={t('Viewer.error.unplayableVideo')}
        renderFallbackExtraContent={renderFallbackExtraContent}
      />
    )
  }

  return (
    <div className={styles['viewer-videoviewer']}>
      <video
        src={url}
        controls="controls"
        onError={() => setIsUnplayable(true)}
      />
      <p className={styles['viewer-filename']}>{file.name}</p>
    </div>
  )
}

export default withFileUrl(withViewerLocales(VideoViewer))
