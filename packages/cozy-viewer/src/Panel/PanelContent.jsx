import cx from 'classnames'
import React from 'react'

import Paper from 'cozy-ui/transpiled/react/Paper'
import Stack from 'cozy-ui/transpiled/react/Stack'

import getPanelBlocks, { getPanelBlocksSpecs } from './getPanelBlocks'
import { withViewerLocales } from '../hoc/withViewerLocales'
import { useViewer } from '../providers/ViewerProvider'

const PanelContent = () => {
  const { file, isPublic, componentsProps, isReadOnly } = useViewer()

  const panelBlocks = getPanelBlocks({
    panelBlocksSpecs: getPanelBlocksSpecs(isPublic, componentsProps?.panel),
    file
  })

  return (
    <Stack spacing="s" className={cx('u-flex u-flex-column u-h-100')}>
      {panelBlocks.map((PanelBlock, index) => (
        <Paper
          key={index}
          className={cx({
            'u-flex-grow-1': index === panelBlocks.length - 1
          })}
          elevation={2}
          square
        >
          <PanelBlock file={file} isPublic={isPublic} isReadOnly={isReadOnly} />
        </Paper>
      ))}
    </Stack>
  )
}

export default withViewerLocales(PanelContent)
