import React, { useEffect, useRef } from 'react'

import { useClient } from 'cozy-client'
import Intents from 'cozy-interapp'
import Dialog, { DialogContent } from 'cozy-ui/transpiled/react/Dialog'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

/**
 * Hosts the Drive `PICK io.cozy.files` intent (folder `reference` mode)
 * in an iframe dialog, so the surrounding wizard keeps its state.
 */
const FolderPickerDialog = ({ open, onClose, onSelect }) => {
  const client = useClient()
  const { t } = useI18n()
  const { showAlert } = useAlert()
  const intentHostRef = useRef(null)

  useEffect(() => {
    if (!open || !intentHostRef.current) return undefined

    const intents = new Intents({ client })
    const startPromise = intents
      .create('PICK', 'io.cozy.files', {
        actions: [
          {
            label: t('assistant_create.from_drive.actions.add'),
            action: 'reference',
            allowFolder: true
          }
        ]
      })
      .start(intentHostRef.current)

    startPromise
      .then(result => {
        const folder = Array.isArray(result) ? result[0] : result
        if (folder) {
          onSelect(folder)
        }
        onClose()
        return undefined
      })
      .catch(() => {
        showAlert({
          message: t('assistant.knowledge_base.picker_error'),
          severity: 'error'
        })
        onClose()
      })

    return () => startPromise.stop?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent className="u-p-0">
        {/* The intent protocol resizes this element itself (inline styles) */}
        <div
          ref={intentHostRef}
          className="u-w-100"
          style={{ minHeight: 480 }}
        />
      </DialogContent>
    </Dialog>
  )
}

export default FolderPickerDialog
