import React, { useEffect, useState } from 'react'

import { useClient } from 'cozy-client'
import Intents from 'cozy-interapp'
import Dialog, { DialogContent } from 'cozy-ui/transpiled/react/Dialog'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'

/**
 * Hosts the Drive `PICK io.cozy.files` intent (folder `reference` mode)
 * in an iframe dialog, so the surrounding wizard keeps its state.
 */
const FolderPickerDialog = ({
  open,
  onClose,
  onSelect,
  multiple = false,
  onlyFolder = true,
  selectLabel
}) => {
  const client = useClient()
  const { t } = useI18n()
  const { showAlert } = useAlert()
  // Callback-ref into state: MUI's Portal attaches the dialog content in its
  // own effect, so a plain ref is still null when this component's first
  // effect runs. State makes the effect re-run once the host node exists.
  const [intentHost, setIntentHost] = useState(null)

  useEffect(() => {
    if (!open || !intentHost) return undefined

    let cancelled = false
    const intents = new Intents({ client })
    const startPromise = intents
      .create('PICK', 'io.cozy.files', {
        // Drive's FilePickerConfig: null hides an action, so only the
        // side-effect-free `reference` action remains visible
        sharingLink: null,
        downloadLink: null,
        ...(multiple && { multiple: true }),
        reference: {
          label: selectLabel ?? t('assistant.knowledge_base.select_folder'),
          allowFolder: true,
          onlyFolder
        }
      })
      .start(intentHost)

    startPromise
      .then(result => {
        if (cancelled) return undefined
        if (multiple) {
          const docs = (Array.isArray(result) ? result : [result]).filter(
            Boolean
          )
          if (docs.length > 0) {
            onSelect(docs)
          }
        } else {
          const folder = Array.isArray(result) ? result[0] : result
          if (folder) {
            onSelect(folder)
          }
        }
        onClose()
        return undefined
      })
      .catch(() => {
        if (cancelled) return
        showAlert({
          message: t('assistant.knowledge_base.picker_error'),
          severity: 'error'
        })
        onClose()
      })

    return () => {
      cancelled = true
      startPromise.stop?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client, intentHost])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent className="u-p-0">
        {/* The intent protocol may also resize this element (inline styles) */}
        <div ref={setIntentHost} className={styles.intentHost} />
      </DialogContent>
    </Dialog>
  )
}

export default FolderPickerDialog
