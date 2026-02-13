import React from 'react'
import { useI18n } from 'twake-i18n'

import { DialogActions } from 'cozy-ui/transpiled/react/Dialog'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'

import { useFilePicker } from '../FilePickerContext'

const FilePickerDialogActions = () => {
  const { t } = useI18n()
  const {
    dialogActionsProps,
    dividerProps,
    onClose,
    onFilesSelected,
    selectedFiles
  } = useFilePicker()

  return (
    <>
      <Divider {...dividerProps} />
      <DialogActions {...dialogActionsProps}>
        <Button
          theme="secondary"
          onClick={() => onClose()}
          label={t('filepicker.actions.cancel')}
        />
        <div style={{ flex: 1 }} />
        <Button
          theme="primary"
          label={t('filepicker.actions.open')}
          onClick={() => onFilesSelected()}
          disabled={selectedFiles.length === 0}
        />
      </DialogActions>
    </>
  )
}

export default FilePickerDialogActions
