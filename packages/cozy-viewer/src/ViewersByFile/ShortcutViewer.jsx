import get from 'lodash/get'
import React from 'react'

import { Openwith } from '@linagora/twake-icons'
import { useClient, useFetchShortcut } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { FileDoctype } from 'cozy-ui-plus/dist/proptypes'

import NoViewer from '../NoViewer'
import { withViewerLocales } from '../hoc/withViewerLocales'

const ShortcutViewer = ({ t, file }) => {
  const client = useClient()
  const { shortcutInfos } = useFetchShortcut(client, file.id)
  let url = ''
  if (shortcutInfos) {
    url = new URL(get(shortcutInfos, 'data.attributes.url'))
  }
  return (
    <NoViewer
      file={file}
      renderFallbackExtraContent={() => (
        <Button
          label={`${t('Viewer.goto', { url: get(url, 'origin', '') })}`}
          startIcon={<Openwith />}
          href={`${get(url, 'origin', '')}`}
          target="_blank"
        />
      )}
    />
  )
}

ShortcutViewer.propTypes = {
  file: FileDoctype.isRequired
}

export default withViewerLocales(ShortcutViewer)
