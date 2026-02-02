import cx from 'classnames'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from 'twake-i18n'

import flag from 'cozy-flags'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossMediumIcon from 'cozy-ui/transpiled/react/Icons/CrossMedium'
import Paper from 'cozy-ui/transpiled/react/Paper'
import Stack from 'cozy-ui/transpiled/react/Stack'
import Typography from 'cozy-ui/transpiled/react/Typography'

import getPanelBlocks, { getPanelBlocksSpecs } from './getPanelBlocks'
import { withViewerLocales } from '../hoc/withViewerLocales'
import { useViewer } from '../providers/ViewerProvider'

const PanelContent = () => {
  const {
    file,
    isPublic,
    componentsProps,
    isReadOnly,
    setIsOpenFileViewerPanel
  } = useViewer()
  const { t } = useI18n()
  const navigate = useNavigate()

  const panelBlocks = getPanelBlocks({
    panelBlocksSpecs: getPanelBlocksSpecs(isPublic, componentsProps?.panel),
    file,
    t
  })

  const closePanel = () => {
    setIsOpenFileViewerPanel(false)
    navigate('', { state: { showDetailPanel: false } })
  }

  return (
    <Stack spacing="s" className={cx('u-flex u-flex-column u-h-100')}>
      {flag('drive.new-file-viewer-ui.enabled') && (
        <Paper
          square
          className="u-flex u-flex-items-center u-flex-justify-between u-h-3 u-ph-1 u-flex-shrink-0"
        >
          <Typography variant="h4">{t('Viewer.panel.header')}</Typography>
          <IconButton aria-label={t('Viewer.close')} onClick={closePanel}>
            <Icon icon={CrossMediumIcon} />
          </IconButton>
        </Paper>
      )}

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
